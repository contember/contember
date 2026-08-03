import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const disablePersonMutation = TenantApi.mutation$
	.disablePerson(
		TenantApi
			.disablePersonResponse$$
			.error(TenantApi.disablePersonError$$),
		options => options.alias('mutation'),
	)

export const useDisablePersonMutation = createTenantMutation(disablePersonMutation)
export type DisablePersonMutationVariables = Parameters<ReturnType<typeof useDisablePersonMutation>>[0]
