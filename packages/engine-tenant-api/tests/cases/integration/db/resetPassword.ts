import { dbSuite } from '../../../src/testTenantDb'
import { signUpMutation } from '../mocked/gql/signUp'
import { createResetPasswordRequestMutation } from '../mocked/gql/createResetPasswordRequest'
import { TenantRole } from '../../../../src/model/authorization'
import { resetPasswordMutation } from '../mocked/gql/resetPassword'
import { signInMutation } from '../mocked/gql/signIn'
import * as assert from 'uvu/assert'

const resetPassword = dbSuite('reset password')

resetPassword('execute password reset', async ({ tester }) => {
	const email = 'john@doe.com'
	const password = 'foobar'

	const signUpResult = await tester.execute(
		signUpMutation({
			email,
			password: '123456',
		}),
		{ roles: [TenantRole.SUPER_ADMIN] },
	)
	assert.is(signUpResult.data.signUp.ok, true)
	tester.mailer.expectEmpty()
	const resetRequestResult = await tester.execute(createResetPasswordRequestMutation({ email }), {
		roles: [TenantRole.LOGIN],
	})
	assert.is(resetRequestResult.data.createResetPasswordRequest.ok, true)
	const mail = tester.mailer.expectMessage({ subject: 'Password reset' })
	const matches = mail.html?.toString().match(/<code>(.+)<\/code>/)
	const token = matches?.[1] as string
	assert.is(token, '3030303030303030303030303030303030303030')

	const resetResult = await tester.execute(resetPasswordMutation({ token, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.is(resetResult.data.resetPassword.ok, true)

	// used token
	const resetResult2 = await tester.execute(resetPasswordMutation({ token, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.is(resetResult2.data.resetPassword.ok, false)

	const signInResult = await tester.execute(signInMutation({ email, password }), {
		roles: [TenantRole.LOGIN],
	})
	assert.is(signInResult.data.signIn.ok, true)
})

resetPassword.run()
