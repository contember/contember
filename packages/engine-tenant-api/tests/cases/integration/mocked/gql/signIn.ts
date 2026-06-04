import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const signInMutation = (
	variables: {
		email: string
		password: string
		otpToken?: string
		backupCode?: string
		options?: { trustForwardedClientInfo?: boolean }
	},
	options: { withData?: boolean } = {},
): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $password: String!, $otpToken: String, $backupCode: String, $options: SignInOptions) {
		signIn(email: $email, password: $password, otpToken: $otpToken, backupCode: $backupCode, options: $options) {
			ok
			errors {code}
			result {
				token
				${
		options.withData
			? `person {
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
			: ''
	}
			}
		}
	}`,
	variables,
})
