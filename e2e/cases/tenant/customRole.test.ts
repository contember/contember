import { expect, test } from 'bun:test'
import { consumeMails, createTester, executeGraphql, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const meQuery = `query { me { id } }`
const personIdQuery = `query { me { person { id } } }`

const createCustomRoleMutation = `mutation($slug: String!, $permissions: [String!]!, $description: String) {
	createCustomRole(slug: $slug, permissions: $permissions, description: $description) { ok error { code } }
}`

const updateCustomRoleMutation = `mutation($slug: String!, $permissions: [String!]) {
	updateCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
}`

const deleteCustomRoleMutation = `mutation($slug: String!) {
	deleteCustomRole(slug: $slug) { ok error { code } }
}`

const customRolesQuery = `query { customRoles { slug description permissions } }`

const grantRolesMutation = `mutation($identityId: String!, $roles: [String!]!) {
	addGlobalIdentityRoles(identityId: $identityId, roles: $roles) { ok error { code } }
}`

const forceSignOutMutation = `mutation($id: String!) {
	forceSignOutPerson(personId: $id) { ok error { code } }
}`

test('custom role grants its permission bundle at runtime', async () => {
	const tester = await createTester(emptySchema)
	const slug = `support_${rand()}`
	const password = 'HWGA51KKpJ4lSW'

	// support person + target person
	const supportEmail = `support-${rand()}@doe.com`
	const targetEmail = `target-${rand()}@doe.com`
	const supportIdentityId = await tester.tenant.signUp(supportEmail, password)
	await tester.tenant.signUp(targetEmail, password)
	const supportToken = await tester.tenant.signIn(supportEmail, password)
	const targetToken = await tester.tenant.signIn(targetEmail, password)

	const targetPersonResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: targetToken })
	const targetPersonId: string = targetPersonResp.body.data.me.person.id

	// without the role, support cannot force sign out
	const deniedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(deniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// super admin defines the role and assigns it
	const createResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, permissions: ['person:forceSignOut', 'customRole:view'], description: 'Support team' },
	})
	expect(createResp.body).toEqual({ data: { createCustomRole: { ok: true, error: null } } })

	const grantResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: supportIdentityId, roles: [slug] },
	})
	expect(grantResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	// the bundle applies on the next request — no re-login
	const allowedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(allowedResp.body.data.forceSignOutPerson).toEqual({ ok: true, error: null })
	await executeGraphql('/tenant', meQuery, { authorizationToken: targetToken }).expect(401)

	// the forced-sign-out notification mail
	const mails = await consumeMails()
	expect(mails).toHaveLength(1)
	expect(mails[0].Content.Headers.To?.[0]).toBe(targetEmail)

	// customRole:view in the bundle lets support read the definitions
	const listResp = await executeGraphql('/tenant', customRolesQuery, { authorizationToken: supportToken })
	expect(listResp.body.data.customRoles).toContainEqual(
		{ slug, description: 'Support team', permissions: ['person:forceSignOut', 'customRole:view'] },
	)

	// narrowing the bundle applies immediately as well
	const updateResp = await executeGraphql('/tenant', updateCustomRoleMutation, {
		variables: { slug, permissions: ['customRole:view'] },
	})
	expect(updateResp.body.data.updateCustomRole.ok).toBe(true)

	const deniedAgainResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(deniedAgainResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// cleanup: deleting the role revokes the rest; the dangling identity role grants nothing
	const deleteResp = await executeGraphql('/tenant', deleteCustomRoleMutation, { variables: { slug } })
	expect(deleteResp.body.data.deleteCustomRole.ok).toBe(true)

	const listDeniedResp = await executeGraphql('/tenant', customRolesQuery, { authorizationToken: supportToken })
	expect(listDeniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)
})

test('custom role cannot act on a super_admin and cannot carry escalation vectors', async () => {
	const tester = await createTester(emptySchema)
	const slug = `support_${rand()}`
	const password = 'HWGA51KKpJ4lSW'

	// escalation vectors are rejected at definition time
	const invalidResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, permissions: ['identity:addGlobalRoles'] },
	})
	expect(invalidResp.body.data.createCustomRole.ok).toBe(false)
	expect(invalidResp.body.data.createCustomRole.error.code).toBe('UNKNOWN_PERMISSION')

	// support person with the force-sign-out bundle
	const supportEmail = `support-${rand()}@doe.com`
	const adminEmail = `admin-${rand()}@doe.com`
	const supportIdentityId = await tester.tenant.signUp(supportEmail, password)
	const adminIdentityId = await tester.tenant.signUp(adminEmail, password)
	const supportToken = await tester.tenant.signIn(supportEmail, password)
	const adminToken = await tester.tenant.signIn(adminEmail, password)

	const createResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, permissions: ['person:forceSignOut'] },
	})
	expect(createResp.body.data.createCustomRole.ok).toBe(true)
	const grantResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: supportIdentityId, roles: [slug] },
	})
	expect(grantResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	// the other person becomes a super_admin — now off-limits for the custom role
	const grantAdminResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: adminIdentityId, roles: ['super_admin'] },
	})
	expect(grantAdminResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	const adminPersonResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: adminToken })
	const adminPersonId: string = adminPersonResp.body.data.me.person.id

	const deniedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: adminPersonId },
	})
	expect(deniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)
	await executeGraphql('/tenant', meQuery, { authorizationToken: adminToken }).expect(200)
})
