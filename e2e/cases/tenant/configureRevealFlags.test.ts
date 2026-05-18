import { expect, test, afterAll } from 'bun:test'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok error { code } }
}`

const configureMutation = `mutation($config: ConfigInput!) {
	configure(config: $config) { ok error { code } }
}`

const setReveal = async (revealUserExists: boolean, revealLoginMethod: boolean) => {
	const resp = await executeGraphql('/tenant', configureMutation, {
		variables: { config: { login: { revealUserExists, revealLoginMethod } } },
	})
	expect(resp.body.data.configure).toEqual({ ok: true, error: null })
}

afterAll(async () => {
	// restore defaults so unrelated parallel test files are not affected
	await setReveal(true, true)
})

// Tenant config is global. The three test cases sequentially flip the flags
// and probe both error paths with throwaway emails to avoid per-email backoff.
test('reveal flags shape signIn error codes', async () => {
	const tester = await createTester(emptySchema)
	const password = 'HWGA51KKpJ4lSW'

	// Default state: revealUserExists=true, revealLoginMethod=true — codes leak.
	await setReveal(true, true)
	{
		const emailA = `wrong-${rand()}@doe.com`
		await tester.tenant.signUp(emailA, password)
		const wrong = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailA, password: 'definitely-wrong' },
		})
		expect(wrong.body.data.signIn.error.code).toBe('INVALID_PASSWORD')

		const unknown = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: `ghost-${rand()}@doe.com`, password },
		})
		expect(unknown.body.data.signIn.error.code).toBe('UNKNOWN_EMAIL')
	}

	// revealUserExists=false: BOTH wrong-password and unknown-email collapse.
	await setReveal(false, true)
	{
		const emailB = `wrong-${rand()}@doe.com`
		await tester.tenant.signUp(emailB, password)
		const wrong = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailB, password: 'definitely-wrong' },
		})
		expect(wrong.body.data.signIn.error.code).toBe('INVALID_CREDENTIALS')

		const unknown = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: `ghost-${rand()}@doe.com`, password },
		})
		expect(unknown.body.data.signIn.error.code).toBe('INVALID_CREDENTIALS')
	}

	// revealUserExists=true, revealLoginMethod=false: only INVALID_PASSWORD
	// collapses; UNKNOWN_EMAIL still leaks existence.
	await setReveal(true, false)
	{
		const emailC = `wrong-${rand()}@doe.com`
		await tester.tenant.signUp(emailC, password)
		const wrong = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailC, password: 'definitely-wrong' },
		})
		expect(wrong.body.data.signIn.error.code).toBe('INVALID_CREDENTIALS')

		const unknown = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: `ghost-${rand()}@doe.com`, password },
		})
		expect(unknown.body.data.signIn.error.code).toBe('UNKNOWN_EMAIL')
	}
})
