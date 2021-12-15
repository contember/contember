import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { useLoginToken } from '@contember/react-client'
import { useMemo } from 'react'

const INIT_SIGN_IN_IDP_MUTATION = `
initSignInIDP(redirectUrl: $redirectUrl, identityProvider: $identityProvider) {
	ok
	error {
		code
		developerMessage
	}
	result {
		authUrl
		sessionData
	}
}
`

const initSignInIdpVariables = {
	redirectUrl: GQLVariable.Required(GQLVariable.String),
	identityProvider: GQLVariable.Required(GQLVariable.String),
}


export interface InitSignInIDPResult {
	authUrl: string
	sessionData: Record<string, any>
}

type InitSignInIDPErrors = 'PROVIDER_NOT_FOUND'

export const useInitSignInIDP = () => {
	const loginToken = useLoginToken()
	return useSingleTenantMutation<InitSignInIDPResult, InitSignInIDPErrors, typeof initSignInIdpVariables>(
		INIT_SIGN_IN_IDP_MUTATION,
		initSignInIdpVariables,
		useMemo(() => ({
			apiTokenOverride: loginToken,
		}), [loginToken]),
	)
}
