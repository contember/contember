import { expect, test } from 'bun:test'
import { consumeMails, createTester, gql, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'
import { signUp } from '../../src/requests'

test('sign in using magic link', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'foobar'
	await signUp(email, password)
	await tester(`mutation {
	configure(config: { passwordless: {enabled: always, url: "https://example.com" }}) {
		ok
	}
}`, {
		path: '/tenant',
	}).expect(200).expect({ data: { configure: { ok: true } } })

	const initResult = await tester(gql`
		mutation($email: String!) {
            initSignInPasswordless(email: $email) {
				ok
				result {
					requestId
				}
            }
        }
	`, {
		path: '/tenant',
		variables: { email },
		authorizationToken: loginToken,
	})
		.expect(200)

	const requestId = initResult.body.data.initSignInPasswordless.result.requestId

	const mails = await consumeMails()
	expect(mails).toHaveLength(1)

	const matches = mails[0].Raw.Data.match(/token&#x3D;(\w+)/)
	const token = matches?.[1] as string
	expect(token).toHaveLength(40)

	// invalid token
	await tester(gql`
        mutation($token: String!, $request: String!) {
            signInPasswordless(requestId: $request, token: $token, validationType: token) {
                ok
                error {
                    code
                }
            }
        }
	`, {
		path: '/tenant',
		variables: { token: 'ABCD', request: requestId },
		authorizationToken: loginToken,
	})
		.expect(200)
		.expect({
			data: {
				signInPasswordless: {
					ok: false,
					error: {
						code: 'TOKEN_INVALID',
					},
				},
			},
		})


	// valid
	await tester(gql`
		mutation($token: String!, $request: String!) {
            signInPasswordless(requestId: $request, token: $token, validationType: token) {
				ok
				error {
					code
				}
			}
		}
	`, {
		path: '/tenant',
		variables: { token, request: requestId },
		authorizationToken: loginToken,
	})
		.expect(200)
		.expect({
			data: {
				signInPasswordless: {
					ok: true,
					error: null,
				},
			},
		})
})
