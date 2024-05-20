import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const signOutMutation = TenantApi.mutation$.signOut(
	TenantApi
		.signOutResponse$$
		.error(TenantApi.signOutError$$),
	options => options.alias('mutation'),
)

export const useSignOutMutation = createTenantMutation(signOutMutation)
export type SignOutMutationVariables = Parameters<ReturnType<typeof useSignOutMutation>>[0]
