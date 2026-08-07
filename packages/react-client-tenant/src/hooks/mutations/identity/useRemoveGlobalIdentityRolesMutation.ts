import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const removeGlobalIdentityRolesResult = TenantApi.removeGlobalIdentityRolesResult$.identity(TenantApi.identity$$)

export type RemoveGlobalIdentityRolesMutationResult = ModelType<typeof removeGlobalIdentityRolesResult>

export const removeGlobalIdentityRolesMutation = TenantApi.mutation$
	.removeGlobalIdentityRoles(
		TenantApi
			.removeGlobalIdentityRolesResponse$$
			.error(TenantApi.removeGlobalIdentityRolesError$$)
			.result(removeGlobalIdentityRolesResult),
		options => options.alias('mutation'),
	)

export const useRemoveGlobalIdentityRolesMutation = createTenantMutation(removeGlobalIdentityRolesMutation)
export type RemoveGlobalIdentityRolesMutationVariables = Parameters<ReturnType<typeof useRemoveGlobalIdentityRolesMutation>>[0]
