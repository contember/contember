import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const createSessionTokenMutation = (
	variables: {
		email: string
	},
	options: { withData?: boolean } = {},
): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!) {
		createSessionToken(email: $email) {
			ok
			error {code}
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
