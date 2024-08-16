import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const addProjectMemberMutation = TenantApi.mutation$
	.addProjectMember(
		TenantApi
			.addProjectMemberResponse$$
			.error(TenantApi.addProjectMemberError$$.membershipValidation(TenantApi.membershipValidationError$$)),
		options => options.alias('mutation'),
	)

export const useAddProjectMemberMutation = createTenantMutation(addProjectMemberMutation)
export type AddProjectMemberMutationVariables = Parameters<ReturnType<typeof useAddProjectMemberMutation>>[0]
