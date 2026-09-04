import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const signInPasswordlessMutation = (
	variables: {
		requestId: string
		token: string
		validationType: 'token' | 'otp'
		mfaOtp?: string
		expiration?: number
	},
): GraphQLTestQuery => ({
	query: GQL`mutation($requestId: String!, $token: String!, $validationType: PasswordlessValidationType!, $mfaOtp: String, $expiration: Int) {
		signInPasswordless(requestId: $requestId, token: $token, validationType: $validationType, mfaOtp: $mfaOtp, expiration: $expiration) {
			ok
			error { code }
			result {
				token
			}
		}
	}`,
	variables,
})

export const initSignInPasswordlessMutation = (variables: { email: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!) {
		initSignInPasswordless(email: $email) {
			ok
			error { code }
		}
	}`,
	variables,
})
