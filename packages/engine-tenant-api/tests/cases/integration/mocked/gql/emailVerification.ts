import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const verifyEmailMutation = (variables: { token: string }): GraphQLTestQuery => ({
	query: GQL`mutation($token: String!) {
		verifyEmail(token: $token) {
			ok
			error { code }
		}
	}`,
	variables,
})

export const requestEmailVerificationMutation = (variables: { email: string; captchaToken?: string }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $captchaToken: String) {
		requestEmailVerification(email: $email, captchaToken: $captchaToken) {
			ok
			error { code }
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
