import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const signInMutation = (
	variables: {
		email: string
		password: string
		otpToken?: string
	},
	options: { withData?: boolean } = {},
): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $password: String!, $otpToken: String) {
		signIn(email: $email, password: $password, otpToken: $otpToken) {
			ok
			errors {code}
			result {
				token
				${options.withData ? `person {
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
				`
		: ''}
			}
		}
	}`,
	variables,
})
