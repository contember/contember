import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const resetPasswordMutation = (variables: { token: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!, $password: String!) {
		resetPassword(token: $token, password: $password) {
			ok
		}
	}`,
	variables: variables,
})
