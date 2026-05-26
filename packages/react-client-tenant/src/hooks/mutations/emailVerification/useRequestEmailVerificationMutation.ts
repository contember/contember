import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'

export const requestEmailVerificationMutation = TenantApi
	.mutation$
	.requestEmailVerification(
		TenantApi
			.requestEmailVerificationResponse$$
			.error(TenantApi.requestEmailVerificationError$$),
		options => options.alias('mutation'),
	)

export const useRequestEmailVerificationMutation = createTenantMutation(requestEmailVerificationMutation, {
	apiToken: LoginToken,
})
export type RequestEmailVerificationMutationVariables = Parameters<ReturnType<typeof useRequestEmailVerificationMutation>>[0]
