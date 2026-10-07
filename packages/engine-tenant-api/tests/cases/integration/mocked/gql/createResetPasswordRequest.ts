import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const createResetPasswordRequestMutation = (variables: { email: string; mailProject?: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $mailProject: String) {
		createResetPasswordRequest(email: $email, options: { mailProject: $mailProject }) {
			ok
		}
	}`,
	variables: variables,
})
