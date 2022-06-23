import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const createResetPasswordRequestMutation = (variables: { email: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!) {
		createResetPasswordRequest(email: $email) {
			ok
		}
	}`,
	variables: variables,
})
