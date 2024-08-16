import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const removeProjectMemberMutation = TenantApi.mutation$
	.removeProjectMember(
		TenantApi
			.removeProjectMemberResponse$$
			.error(TenantApi.removeProjectMemberError$$),
		options => options.alias('mutation'),
	)

export const useRemoveProjectMemberMutation = createTenantMutation(removeProjectMemberMutation)
export type RemoveProjectMemberMutationVariables = Parameters<ReturnType<typeof useRemoveProjectMemberMutation>>[0]
