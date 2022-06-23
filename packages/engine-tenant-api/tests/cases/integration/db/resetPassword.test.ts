import { signUpMutation } from '../mocked/gql/signUp.js'
import { createResetPasswordRequestMutation } from '../mocked/gql/createResetPasswordRequest.js'
import { TenantRole } from '../../../../src/model/authorization/index.js'
import { resetPasswordMutation } from '../mocked/gql/resetPassword.js'
import { signInMutation } from '../mocked/gql/signIn.js'
import { test, assert } from 'vitest'
import { testTenantDb } from '../../../src/testTenantDb.js'

test('execute password reset', testTenantDb(async ({ tester }) => {
	const email = 'john@doe.com'
	const password = 'foobar'

	const signUpResult = await tester.execute(
		signUpMutation({
			email,
			password: '123456',
		}),
		{ roles: [TenantRole.SUPER_ADMIN] },
	)
	assert.strictEqual(signUpResult.data.signUp.ok, true)
	tester.mailer.expectEmpty()
	const resetRequestResult = await tester.execute(createResetPasswordRequestMutation({ email }), {
		roles: [TenantRole.LOGIN],
	})
	assert.strictEqual(resetRequestResult.data.createResetPasswordRequest.ok, true)
	const mail = tester.mailer.expectMessage({ subject: 'Password reset' })
	const matches = mail.html?.toString().match(/<code>(.+)<\/code>/)
	const token = matches?.[1] as string
	assert.strictEqual(token, '3030303030303030303030303030303030303030')

	const resetResult = await tester.execute(resetPasswordMutation({ token, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.strictEqual(resetResult.data.resetPassword.ok, true)

	// used token
	const resetResult2 = await tester.execute(resetPasswordMutation({ token, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.strictEqual(resetResult2.data.resetPassword.ok, false)

	const signInResult = await tester.execute(signInMutation({ email, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.strictEqual(signInResult.data.signIn.ok, true)
}))
