import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const addGlobalIdentityRolesResult = TenantApi.addGlobalIdentityRolesResult$.identity(TenantApi.identity$$)

export type AddGlobalIdentityRolesMutationResult = ModelType<typeof addGlobalIdentityRolesResult>

export const addGlobalIdentityRolesMutation = TenantApi.mutation$
	.addGlobalIdentityRoles(
		TenantApi
			.addGlobalIdentityRolesResponse$$
			.error(TenantApi.addGlobalIdentityRolesError$$)
			.result(addGlobalIdentityRolesResult),
		options => options.alias('mutation'),
	)

export const useAddGlobalIdentityRolesMutation = createTenantMutation(addGlobalIdentityRolesMutation)
export type AddGlobalIdentityRolesMutationVariables = Parameters<ReturnType<typeof useAddGlobalIdentityRolesMutation>>[0]
