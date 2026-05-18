import { expect, test } from 'bun:test'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok error { code } result { token } }
}`

const grantRolesMutation = `mutation($identityId: String!, $roles: [String!]!) {
	addGlobalIdentityRoles(identityId: $identityId, roles: $roles) { ok error { code } }
}`

const authLogQuery = `query($filter: AuthLogFilter, $limit: Int) {
	authLog(filter: $filter, limit: $limit) {
		hasMore
		entries {
			id
			type
			success
			personId
			targetPersonId
			personInputIdentifier
			errorCode
			eventData
		}
	}
}`

interface Entry {
	id: string
	type: string
	success: boolean
	personId: string | null
	targetPersonId: string | null
	personInputIdentifier: string | null
	errorCode: string | null
	eventData: { before: { roles: string[] }; after: { roles: string[] } } | null
}

test('authLog records login attempts and role grants, and filters by type + targetPersonId', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)

	// successful login first; the per-email backoff triggered by the failed
	// attempt below would otherwise block any retry within ~1s.
	const goodToken = await tester.tenant.signIn(email, password)
	const personResp = await executeGraphql('/tenant', `query { me { person { id } } }`, { authorizationToken: goodToken })
	const personId: string = personResp.body.data.me.person.id

	// failed login
	const badResp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password: 'definitely-wrong' },
	})
	expect(badResp.body.data.signIn.ok).toBe(false)

	// SUPER_ADMIN grants a global role
	const grantResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId, roles: ['project_creator'] },
	})
	expect(grantResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	// unfiltered window
	const allResp = await executeGraphql('/tenant', authLogQuery, {
		variables: { limit: 50 },
	})
	expect(allResp.status).toBe(200)
	const allEntries = allResp.body.data.authLog.entries as Entry[]

	const eventsForOurUser = allEntries.filter(e =>
		e.personId === personId || e.targetPersonId === personId || e.personInputIdentifier === email
	)
	const failedLogin = eventsForOurUser.find(e => e.type === 'login' && !e.success)
	const successfulLogin = eventsForOurUser.find(e => e.type === 'login' && e.success)
	const roleGrant = eventsForOurUser.find(e => e.type === 'global_role_grant')

	expect(failedLogin).toBeDefined()
	expect(failedLogin!.personInputIdentifier).toBe(email)
	expect(failedLogin!.errorCode).toBeTruthy()

	expect(successfulLogin).toBeDefined()
	expect(successfulLogin!.personId).toBe(personId)

	expect(roleGrant).toBeDefined()
	expect(roleGrant!.targetPersonId).toBe(personId)
	expect(roleGrant!.eventData).toEqual({
		before: { roles: ['person'] },
		after: { roles: ['person', 'project_creator'] },
	})

	// filtered by type + targetPersonId — should only return the grant
	const filteredResp = await executeGraphql('/tenant', authLogQuery, {
		variables: {
			filter: { types: ['global_role_grant'], targetPersonId: personId },
			limit: 10,
		},
	})
	const filtered = filteredResp.body.data.authLog.entries as Entry[]
	expect(filtered).toHaveLength(1)
	expect(filtered[0].type).toBe('global_role_grant')
	expect(filtered[0].targetPersonId).toBe(personId)
	expect(filteredResp.body.data.authLog.hasMore).toBe(false)
})

test('authLog is gated by system:viewAuthLog — a regular PERSON cannot read it', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const personToken = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', authLogQuery, {
		authorizationToken: personToken,
		variables: { limit: 10 },
	})
	expect(resp.body.errors).toBeDefined()
	expect(resp.body.errors[0].message).toMatch(/audit log|allowed/i)
})
