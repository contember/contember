import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'
import { ModelType } from 'graphql-ts-client-api'


export type InitSignInIDPMutationVariables = {
	identityProvider: string
	data: {
		redirectUrl?: string
	} & {
		[key: string]: string
	}
}
export type InitSignInIDPMutationResult = ModelType<typeof TenantApi.initSignInIDPResult$$>

const InitSignInIDPMutation = TenantApi
	.mutation$
	.initSignInIDP(
		TenantApi
			.initSignInIDPResponse$$
			.error(TenantApi.initSignInIDPError$$)
			.result(TenantApi.initSignInIDPResult$.authUrl.sessionData),
		options => options.alias('mutation'),
	)

export const useInitSignInIDPMutation = createTenantMutation<InitSignInIDPMutationResult, TenantApi.InitSignInIDPErrorCode, InitSignInIDPMutationVariables>(InitSignInIDPMutation, {
	apiToken: LoginToken,
})
