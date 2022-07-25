import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const signInIDP = (
	variables: {
		identityProvider: string
		idpResponse: {
			url: string
		}
		redirectUrl: string
		sessionData: any
	},
): GraphQLTestQuery => ({
	query: GQL`mutation($identityProvider: String!, $idpResponse: IDPResponseInput!, $redirectUrl: String!, $sessionData: Json!) {
		signInIDP(identityProvider: $identityProvider, idpResponse: $idpResponse, redirectUrl: $redirectUrl, sessionData: $sessionData) {
			ok
			errors {code}
			result {
				token
			}
		}
	}`,
	variables,
})
