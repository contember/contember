import { expect, test } from 'bun:test'
import { createTester, executeGraphql, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const createSessionTokenMutation = `mutation($email: String, $personId: String) {
	createSessionToken(email: $email, personId: $personId) {
		ok
		error { code }
		result { token person { id identity { id } } }
	}
}`

test('SUPER_ADMIN mints a session token for another person and that token authenticates as them', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const targetIdentityId = await tester.tenant.signUp(email, password)

	const resp = await executeGraphql('/tenant', createSessionTokenMutation, {
		variables: { email, personId: null },
	})
	expect(resp.body.data.createSessionToken.ok).toBe(true)
	const token: string = resp.body.data.createSessionToken.result.token
	expect(token).toHaveLength(40)
	expect(resp.body.data.createSessionToken.result.person.identity.id).toBe(targetIdentityId)

	const meResp = await executeGraphql('/tenant', `query { me { id person { id email } } }`, {
		authorizationToken: token,
	})
	expect(meResp.status).toBe(200)
	expect(meResp.body.data.me.id).toBe(targetIdentityId)
	expect(meResp.body.data.me.person.email).toBe(email)
})

test('createSessionToken returns UNKNOWN_EMAIL for an email that has no person', async () => {
	const tester = await createTester(emptySchema)
	void tester
	const resp = await executeGraphql('/tenant', createSessionTokenMutation, {
		variables: { email: `ghost-${rand()}@doe.com`, personId: null },
	})
	expect(resp.body.data.createSessionToken.ok).toBe(false)
	expect(resp.body.data.createSessionToken.error.code).toBe('UNKNOWN_EMAIL')
})
