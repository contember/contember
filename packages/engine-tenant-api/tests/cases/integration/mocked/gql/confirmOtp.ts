import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

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
