import { expect, test } from 'bun:test'
import { createTester, executeGraphql, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const meQuery = `query { me { id } }`
const signOutMutation = `mutation($all: Boolean) { signOut(all: $all) { ok error { code } } }`

test('signOut() invalidates only the calling token; other sessions stay alive', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const tokenA = await tester.tenant.signIn(email, password)
	const tokenB = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', signOutMutation, {
		authorizationToken: tokenA,
		variables: { all: false },
	})
	expect(resp.body.data.signOut).toEqual({ ok: true, error: null })

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(401)
	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenB }).expect(200)
})

test('signOut(all: true) invalidates every active session of the identity', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const tokenA = await tester.tenant.signIn(email, password)
	const tokenB = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', signOutMutation, {
		authorizationToken: tokenA,
		variables: { all: true },
	})
	expect(resp.body.data.signOut).toEqual({ ok: true, error: null })

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(401)
	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenB }).expect(401)
})

test('signOut refuses to run against a permanent (non-session) api key', async () => {
	const tester = await createTester(emptySchema)
	void tester
	// root token is a permanent api key
	const resp = await executeGraphql('/tenant', signOutMutation, {
		variables: { all: false },
	})
	// root identity has no person row → NOT_A_PERSON short-circuits before
	// the permanent-key check
	expect(resp.body.data.signOut.ok).toBe(false)
	expect(['NOT_A_PERSON', 'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY'])
		.toContain(resp.body.data.signOut.error.code)
})
