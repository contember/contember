import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

export const confirmOtpMutation = (variables: { token: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!) {
		confirmOtp(otpToken: $token) {
			ok
			errors {
				code
			}
		}
	}`,
	variables,
})
