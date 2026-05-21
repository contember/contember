import { expect, test } from 'bun:test'
import { consumeMails, createTester, executeGraphql, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const meQuery = `query { me { id } }`
const personIdQuery = `query { me { person { id } } }`
const forceSignOutMutation = `mutation($id: String!, $reason: String) {
	forceSignOutPerson(personId: $id, reason: $reason) { ok error { code } }
}`

test('forceSignOutPerson disables every active session of the target identity and sends a notification mail', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const tokenA = await tester.tenant.signIn(email, password)
	const tokenB = await tester.tenant.signIn(email, password)

	const personResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: tokenA })
	const personId = personResp.body.data.me.person.id as string
	expect(personId).toBeDefined()

	const resp = await executeGraphql('/tenant', forceSignOutMutation, {
		variables: { id: personId, reason: 'compromise suspected' },
	})
	expect(resp.body).toEqual({
		data: { forceSignOutPerson: { ok: true, error: null } },
	})

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(401)
	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenB }).expect(401)

	// user can sign in again
	const tokenC = await tester.tenant.signIn(email, password)
	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenC }).expect(200)

	const mails = await consumeMails()
	expect(mails).toHaveLength(1)
	expect(mails[0].Content.Headers.To?.[0]).toBe(email)
})

test('forceSignOutPerson returns PERSON_NOT_FOUND for an unknown personId without sending mail', async () => {
	const tester = await createTester(emptySchema)
	void tester
	const resp = await executeGraphql('/tenant', forceSignOutMutation, {
		variables: { id: '00000000-0000-0000-0000-000000000000', reason: null },
	})
	expect(resp.body.data.forceSignOutPerson.ok).toBe(false)
	expect(resp.body.data.forceSignOutPerson.error.code).toBe('PERSON_NOT_FOUND')
})
