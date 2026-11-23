import * as TenantApi from '@contember/graphql-client-tenant'
import { useCallback } from 'react'
import { LoginToken, TenantApiOptions } from '../../useTenantApi.js'
import { createTenantMutation, TenantMutationResponse } from '../../useTenantMutation.js'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'

// Explicit fields and arguments, not `$$` and the generated defaults: IDP sign-in must work against older engines too,
// which have neither `SignInIDPResult.idpResponse` nor the `SignInOptions` input.
const signInIdpFragment = TenantApi.signInIDPResult$.token.person(TenantApi.person$.id.email.name)

export type SignInIDPMutationResult = ModelType<typeof signInIdpFragment>

export const signInIDPMutation = TenantApi
	.mutation$
	.signInIDP(
		{
			identityProvider: ParameterRef.of('identityProvider'),
			data: ParameterRef.of('data'),
			expiration: ParameterRef.of('expiration'),
		},
		TenantApi
			.signInIDPResponse$$
			.error(TenantApi.signInIDPError$$)
			.result(signInIdpFragment),
		options => options.alias('mutation'),
	)

export type SignInIDPMutationVariables = {
	identityProvider: string
	expiration?: number
	data:
		& {
			url?: string
			redirectUrl?: string
			sessionData?: any
		}
		& { [key: string]: any }
}

// Explicit argument refs make every variable a required key, so `expiration` is passed through as possibly undefined.
const useSignInIDPFetcherMutation = createTenantMutation(
	signInIDPMutation,
	{
		apiToken: LoginToken,
	},
)

export const useSignInIDPMutation = (options?: TenantApiOptions) => {
	const signIn = useSignInIDPFetcherMutation(options)
	return useCallback(
		(variables: SignInIDPMutationVariables): Promise<TenantMutationResponse<SignInIDPMutationResult, TenantApi.SignInIDPErrorCode>> =>
			signIn({ ...variables, expiration: variables.expiration }),
		[signIn],
	)
}
