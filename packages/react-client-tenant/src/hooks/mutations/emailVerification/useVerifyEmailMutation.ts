import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'

export const verifyEmailMutation = TenantApi
	.mutation$
	.verifyEmail(
		TenantApi
			.verifyEmailResponse$$
			.error(TenantApi.verifyEmailError$$),
		options => options.alias('mutation'),
	)

export const useVerifyEmailMutation = createTenantMutation(verifyEmailMutation, {
	apiToken: LoginToken,
})
export type VerifyEmailMutationVariables = Parameters<ReturnType<typeof useVerifyEmailMutation>>[0]
