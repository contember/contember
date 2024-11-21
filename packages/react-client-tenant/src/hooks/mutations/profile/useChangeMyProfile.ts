import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const changeMyProfile = TenantApi.mutation$
	.changeMyProfile(
		TenantApi
		  .changeMyProfileResponse$$
		  .error(TenantApi.changeMyProfileError$$),
		options => options.alias('mutation'),
	)

export const useChangeMyProfileMutation = createTenantMutation(changeMyProfile)
export type ChangeMyProfileMutationVariables = Parameters<ReturnType<typeof useChangeMyProfileMutation>>[0]
