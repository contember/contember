import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

// The response also carries a deprecated `errors` array; only the singular `error` is selected.
export const changePasswordMutation = TenantApi.mutation$
	.changePassword(
		TenantApi
			.changePasswordResponse$$
			.error(TenantApi.changePasswordError$$),
		options => options.alias('mutation'),
	)

export const useChangePasswordMutation = createTenantMutation(changePasswordMutation)
export type ChangePasswordMutationVariables = Parameters<ReturnType<typeof useChangePasswordMutation>>[0]
