import { expect, test } from 'bun:test'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const changeMyPasswordMutation = `mutation($cur: String!, $next: String!) {
	changeMyPassword(currentPassword: $cur, newPassword: $next) {
		ok
		error { code weakPasswordReasons }
	}
}`

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok error { code } result { token } }
}`

test('changeMyPassword rotates the credential: old password fails, new one works', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const oldPassword = 'HWGA51KKpJ4lSW'
	const newPassword = 'NeWPassW0rd!XYZ'
	await tester.tenant.signUp(email, oldPassword)
	const token = await tester.tenant.signIn(email, oldPassword)

	const resp = await executeGraphql('/tenant', changeMyPasswordMutation, {
		authorizationToken: token,
		variables: { cur: oldPassword, next: newPassword },
	})
	expect(resp.body.data.changeMyPassword).toEqual({ ok: true, error: null })

	// new password first; a failed old-password attempt below would otherwise
	// trip the per-email backoff and block any retry within ~1s
	const withNew = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password: newPassword },
	})
	expect(withNew.body.data.signIn.ok).toBe(true)
	expect(withNew.body.data.signIn.result.token).toHaveLength(40)

	const withOld = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password: oldPassword },
	})
	expect(withOld.body.data.signIn.ok).toBe(false)
	expect(withOld.body.data.signIn.error.code).toBe('INVALID_PASSWORD')
})

test('changeMyPassword rejects wrong currentPassword', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', changeMyPasswordMutation, {
		authorizationToken: token,
		variables: { cur: 'definitely-wrong', next: 'NeWPassW0rd!XYZ' },
	})
	expect(resp.body.data.changeMyPassword.ok).toBe(false)
	expect(resp.body.data.changeMyPassword.error.code).toBeTruthy()
})
