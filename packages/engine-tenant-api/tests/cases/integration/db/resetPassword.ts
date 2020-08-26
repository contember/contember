import 'jasmine'
import { createTenantTester } from '../../../src/testTenantDb'
import { signUpMutation } from '../mocked/gql/signUp'
import { createResetPasswordRequestMutation } from '../mocked/gql/createResetPasswordRequest'
import { TenantRole } from '../../../../src/model/authorization'
import { resetPasswordMutation } from '../mocked/gql/resetPassword'
import { signInMutation } from '../mocked/gql/signIn'

describe('reset password', () => {
	it('a person can execute password reset', async () => {
		const tester = await createTenantTester()
		const email = 'john@doe.com'
		const password = 'foobar'

		const signUpResult = await tester.execute(
			signUpMutation({
				email,
				password: '123456',
			}),
			{ roles: [TenantRole.SUPER_ADMIN] },
		)
		expect(signUpResult.data.signUp.ok).toBeTrue()
		tester.mailer.expectEmpty()
		const resetRequestResult = await tester.execute(createResetPasswordRequestMutation({ email }), {
			roles: [TenantRole.LOGIN],
		})
		expect(resetRequestResult.data.createResetPasswordRequest.ok).toBeTrue()
		const mail = tester.mailer.expectMessage({ subject: 'Password reset' })
		const matches = mail.html?.toString().match(/<code>(.+)<\/code>/)
		const token = matches?.[1] as string
		expect(token).toBe('0000000000000000000000000000000000000000')

		const resetResult = await tester.execute(resetPasswordMutation({ token, password }), {
			roles: [TenantRole.LOGIN],
		})
		expect(resetResult.data.resetPassword.ok).toBeTrue()

		// used token
		const resetResult2 = await tester.execute(resetPasswordMutation({ token, password }), {
			roles: [TenantRole.LOGIN],
		})
		expect(resetResult2.data.resetPassword.ok).toBeFalse()

		const signInResult = await tester.execute(signInMutation({ email, password }), {
			roles: [TenantRole.LOGIN],
		})
		expect(signInResult.data.signIn.ok).toBeTrue()
		await tester.end()
	}, 10000)
})
