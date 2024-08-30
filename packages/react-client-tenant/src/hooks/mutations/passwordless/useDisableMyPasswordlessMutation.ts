import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'


const DisableMyPasswordlessMutation = TenantApi
	.mutation$
	.disableMyPasswordless(
		TenantApi
			.toggleMyPasswordlessResponse$$
			.error(TenantApi.toggleMyPasswordlessError$$),
		options => options.alias('mutation'),
	)

export const useDisableMyPasswordlessMutation = createTenantMutation(DisableMyPasswordlessMutation)
