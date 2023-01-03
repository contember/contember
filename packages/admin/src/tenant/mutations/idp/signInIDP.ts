import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { useLoginToken } from '@contember/react-client'
import { useMemo } from 'react'

const SIGN_IN_IDP_MUTATION = `
signInIDP(identityProvider: $identityProvider, idpResponse: {url: $url}, redirectUrl: $redirectUrl, sessionData: $session, expiration: $expiration) {
	ok
	error {
		developerMessage
		code
	}
	result {
		token
		person {
			id
			email
		}
	}
}
`

const SignInIdpVariables = {
	redirectUrl: GQLVariable.Required(GQLVariable.String),
	url: GQLVariable.Required(GQLVariable.String),
	identityProvider: GQLVariable.Required(GQLVariable.String),
	session: GQLVariable.Required(GQLVariable.Json),
	expiration: GQLVariable.Int,
}


export interface SignInIDPResult {
	token: string
	person: {
		id: string
		email: string
	}
}

export type SignInIDPErrors =
	| 'INVALID_IDP_RESPONSE'
	| 'IDP_VALIDATION_FAILED'
	| 'PERSON_NOT_FOUND'

export const useSignInIDP = () => {
	const loginToken = useLoginToken()
	return useSingleTenantMutation<SignInIDPResult, SignInIDPErrors, typeof SignInIdpVariables>(
		SIGN_IN_IDP_MUTATION,
		SignInIdpVariables,
		useMemo(() => ({
			apiTokenOverride: loginToken,
			headers: {
				'X-Contember-Token-Path': 'data.result.result.token',
			},
		}), [loginToken]),
	)
}
