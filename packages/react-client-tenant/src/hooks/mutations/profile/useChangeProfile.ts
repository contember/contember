import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const changeProfile = TenantApi.mutation$
	.changeProfile(
		TenantApi
		  .changeProfileResponse$$
		  .error(TenantApi.changeProfileError$$),
		options => options.alias('mutation'),
	)

export const useChangeProfileMutation = createTenantMutation(changeProfile)
export type ChangeProfileMutationVariables = Parameters<ReturnType<typeof useChangeProfileMutation>>[0]
