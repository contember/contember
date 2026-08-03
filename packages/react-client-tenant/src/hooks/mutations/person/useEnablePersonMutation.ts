import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const enablePersonMutation = TenantApi.mutation$
	.enablePerson(
		TenantApi
			.enablePersonResponse$$
			.error(TenantApi.enablePersonError$$),
		options => options.alias('mutation'),
	)

export const useEnablePersonMutation = createTenantMutation(enablePersonMutation)
export type EnablePersonMutationVariables = Parameters<ReturnType<typeof useEnablePersonMutation>>[0]
