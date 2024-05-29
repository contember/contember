import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const updateProjectMemberMutation = TenantApi.mutation$
	.updateProjectMember(
		TenantApi
			.updateProjectMemberResponse$$
			.error(TenantApi.updateProjectMemberError$$.membershipValidation(TenantApi.membershipValidationError$$)),
		options => options.alias('mutation'),
	)

export const useUpdateProjectMemberMutation = createTenantMutation(updateProjectMemberMutation)
export type UpdateProjectMemberMutationVariables = Parameters<ReturnType<typeof useUpdateProjectMemberMutation>>[0]
