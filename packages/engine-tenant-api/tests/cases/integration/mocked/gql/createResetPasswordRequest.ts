import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const createResetPasswordRequestMutation = (variables: { email: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!) {
		createResetPasswordRequest(email: $email) {
			ok
		}
	}`,
	variables: variables,
})
