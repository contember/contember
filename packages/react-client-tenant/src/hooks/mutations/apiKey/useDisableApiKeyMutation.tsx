import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'


export const disableApiKeyMutation = TenantApi.mutation$
	.disableApiKey(
		TenantApi
			.disableApiKeyResponse$$
			.error(TenantApi.disableApiKeyError$$),
		options => options.alias('mutation'),
	)

export const useDisableApiKeyMutation = createTenantMutation(disableApiKeyMutation)
export type DisableApiKeyMutationVariables = Parameters<ReturnType<typeof useDisableApiKeyMutation>>[0]
