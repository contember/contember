import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

export const prepareOtpMutation = (variables: {}): GraphQLTestQuery => ({
	query: GQL`mutation {
		prepareOtp {
			ok
			result {
				otpUri
			}
		}
	}`,
	variables,
})
