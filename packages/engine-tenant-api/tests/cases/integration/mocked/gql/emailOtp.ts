import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const confirmEmailOtpMutation = (variables: { token: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!) {
		confirmEmailOtp(otpToken: $token) {
			ok
			error { code }
			result { backupCodes }
		}
	}`,
	variables,
})

export const initEmailOtpMutation = (): GraphQLTestQuery => ({
	query: GQL`mutation {
		initEmailOtp {
			ok
			error { code }
		}
	}`,
	variables: {},
})
