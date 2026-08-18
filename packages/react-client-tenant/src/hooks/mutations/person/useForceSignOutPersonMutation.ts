import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const forceSignOutPersonMutation = TenantApi.mutation$
	.forceSignOutPerson(
		TenantApi
			.forceSignOutPersonResponse$$
			.error(TenantApi.forceSignOutPersonError$$),
		options => options.alias('mutation'),
	)

export const useForceSignOutPersonMutation = createTenantMutation(forceSignOutPersonMutation)
export type ForceSignOutPersonMutationVariables = Parameters<ReturnType<typeof useForceSignOutPersonMutation>>[0]
