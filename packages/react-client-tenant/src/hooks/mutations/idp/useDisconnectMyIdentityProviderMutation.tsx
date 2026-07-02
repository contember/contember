import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const disconnectMyIdentityProviderMutation = TenantApi.mutation$
	.disconnectMyIdentityProvider(
		TenantApi
			.disconnectIDPResponse$$
			.error(TenantApi.disconnectIDPError$$),
		options => options.alias('mutation'),
	)

export const useDisconnectMyIdentityProviderMutation = createTenantMutation(disconnectMyIdentityProviderMutation)
export type DisconnectMyIdentityProviderMutationVariables = Parameters<ReturnType<typeof useDisconnectMyIdentityProviderMutation>>[0]
