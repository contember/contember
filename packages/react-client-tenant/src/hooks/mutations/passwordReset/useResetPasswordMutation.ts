import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'

export const resetPasswordMutation = TenantApi
	.mutation$
	.resetPassword(
		TenantApi
			.resetPasswordResponse$$
			.error(TenantApi.resetPasswordError$$),
		options => options.alias('mutation'),
	)

export const useResetPasswordMutation = createTenantMutation(resetPasswordMutation, {
	apiToken: LoginToken,
})
export type ResetPasswordMutationVariables = Parameters<ReturnType<typeof useResetPasswordMutation>>[0]
