import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const resetPersonMfaMutation = TenantApi.mutation$
	.resetPersonMfa(
		TenantApi
			.resetPersonMfaResponse$$
			.error(TenantApi.resetPersonMfaError$$),
		options => options.alias('mutation'),
	)

export const useResetPersonMfaMutation = createTenantMutation(resetPersonMfaMutation)
export type ResetPersonMfaMutationVariables = Parameters<ReturnType<typeof useResetPersonMfaMutation>>[0]
