import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const resetPasswordMutation = (variables: { token: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!, $password: String!) {
		resetPassword(token: $token, password: $password) {
			ok
		}
	}`,
	variables: variables,
})
