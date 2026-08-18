import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const revokeSessionMutation = TenantApi.mutation$
	.revokeSession(
		TenantApi
			.revokeSessionResponse$$
			.error(TenantApi.revokeSessionError$$),
		options => options.alias('mutation'),
	)

export const useRevokeSessionMutation = createTenantMutation(revokeSessionMutation)
export type RevokeSessionMutationVariables = Parameters<ReturnType<typeof useRevokeSessionMutation>>[0]
