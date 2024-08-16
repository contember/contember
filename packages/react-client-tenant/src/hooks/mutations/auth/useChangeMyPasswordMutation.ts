import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const changeMyPasswordMutation = TenantApi
	.mutation$
	.changeMyPassword(
		TenantApi
			.changeMyPasswordResponse$$
			.error(TenantApi.changeMyPasswordError$$),
		options => options.alias('mutation'),
	)

export const useChangeMyPasswordMutation = createTenantMutation(changeMyPasswordMutation)
export type ChangeMyPasswordMutationVariables = Parameters<ReturnType<typeof useChangeMyPasswordMutation>>[0]
