import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const setProjectSecretMutation = TenantApi.mutation$
	.setProjectSecret(
		TenantApi
			.setProjectSecretResponse$$
			.error(TenantApi.setProjectSecretError$$),
		options => options.alias('mutation'),
	)

export const useSetProjectSecretMutation = createTenantMutation(setProjectSecretMutation)
export type SetProjectSecretMutationVariables = Parameters<ReturnType<typeof useSetProjectSecretMutation>>[0]
