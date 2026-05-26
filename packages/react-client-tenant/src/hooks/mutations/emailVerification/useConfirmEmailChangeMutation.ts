import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'

export const confirmEmailChangeMutation = TenantApi
	.mutation$
	.confirmEmailChange(
		TenantApi
			.confirmEmailChangeResponse$$
			.error(TenantApi.confirmEmailChangeError$$),
		options => options.alias('mutation'),
	)

export const useConfirmEmailChangeMutation = createTenantMutation(confirmEmailChangeMutation, {
	apiToken: LoginToken,
})
export type ConfirmEmailChangeMutationVariables = Parameters<ReturnType<typeof useConfirmEmailChangeMutation>>[0]
