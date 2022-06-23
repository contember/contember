import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const signUpMutation = (variables: { email: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $password: String!) {
		signUp(email: $email password: $password) {
			ok
			errors {
				code
			}
			result {
				person {
					id
				}
			}
		}
	}`,
	variables: variables,
})
