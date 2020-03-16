import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const signInMutation = (variables: { email: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $password: String!) {
		signIn(email: $email, password: $password) {
			ok
			result {
				token
				person {
					id
					identity {
						projects {
							project {
								slug
							}
							memberships {
								role
							}
						}
					}
				}
			}
		}
	}`,
	variables,
})
