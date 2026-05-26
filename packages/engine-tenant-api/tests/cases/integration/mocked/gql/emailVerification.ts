import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const verifyEmailMutation = (variables: { token: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!) {
		verifyEmail(token: $token) {
			ok
			error { code }
		}
	}`,
	variables,
})

export const requestEmailVerificationMutation = (variables: { email: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!) {
		requestEmailVerification(email: $email) {
			ok
		}
	}`,
	variables,
})

export const confirmEmailChangeMutation = (variables: { token: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!) {
		confirmEmailChange(token: $token) {
			ok
			error { code }
		}
	}`,
	variables,
})
