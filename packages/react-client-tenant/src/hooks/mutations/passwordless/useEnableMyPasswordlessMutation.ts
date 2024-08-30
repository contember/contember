import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'


const EnableMyPasswordlessMutation = TenantApi
	.mutation$
	.enableMyPasswordless(
		TenantApi
			.toggleMyPasswordlessResponse$$
			.error(TenantApi.toggleMyPasswordlessError$$),
		options => options.alias('mutation'),
	)

export const useEnableMyPasswordlessMutation = createTenantMutation(EnableMyPasswordlessMutation)
