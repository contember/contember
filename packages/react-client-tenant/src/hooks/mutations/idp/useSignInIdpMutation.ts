import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'
import { ModelType } from 'graphql-ts-client-api'

const signInIdpFragment = TenantApi.signInIDPResult$$.person(TenantApi.person$$)

export type SignInIDPMutationResult = ModelType<typeof signInIdpFragment>

export const signInIDPMutation = TenantApi
	.mutation$
	.signInIDP(
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


export const useSignInIDPMutation = createTenantMutation<SignInIDPMutationResult, TenantApi.SignInIDPErrorCode, SignInIDPMutationVariables>(signInIDPMutation, {
	apiToken: LoginToken,
})
