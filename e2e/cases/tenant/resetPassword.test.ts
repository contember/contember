import { expect, test } from 'bun:test'
import { consumeMails, createTester, gql, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'
import { signIn, signUp } from '../../src/requests'

test('execute password reset', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await signUp(email, password)

	await tester(gql`
		mutation($email: String!) {
			createResetPasswordRequest(email: $email) {
				ok
            }
        }
	`, {
		path: '/tenant',
		variables: { email },
		authorizationToken: loginToken,
	})
		.expect(200)
		.expect({
			data: {
				createResetPasswordRequest: {
					ok: true,
				},
			},
		})
	const mails = await consumeMails()
	expect(mails).toHaveLength(1)

	const matches = mails[0].Raw.Data.match(/<code>(.+)<\/code>/)
	const token = matches?.[1] as string
	expect(token).toHaveLength(40)

	await tester(gql`
		mutation($token: String!, $password: String!) {
			resetPassword(token: $token, password: $password) {
				ok
			}
		}
	`, {
		path: '/tenant',
		variables: { token, password },
		authorizationToken: loginToken,
	})
		.expect(200)
		.expect({
			data: {
				resetPassword: {
					ok: true,
				},
			},
		})
	// used token

	await tester(gql`
		mutation($token: String!, $password: String!) {
			resetPassword(token: $token, password: $password) {
				ok
			}
		}
	`, {
		path: '/tenant',
		variables: { token, password },
		authorizationToken: loginToken,
	})
		.expect(200)
		.expect({
			data: {
				resetPassword: {
					ok: false,
				},
			},
		})

	const authToken = await signIn(email, password)
	expect(authToken).toHaveLength(40)

})
