import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

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
