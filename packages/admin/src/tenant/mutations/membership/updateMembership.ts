import { GQLVariable, GQLVariableType, useSingleTenantMutation } from '../../lib'
import { Membership } from '../../types'

const UPDATE_MEMBERSHIP_QUERY = `
	updateProjectMember(
		projectSlug: $projectSlug,
		identityId: $identityId,
		memberships: $memberships
	) {
		ok
		errors {
			code
		}
	}
`

export const MembershipInput: GQLVariableType<Membership, false> = { graphQlType: 'MembershipInput', required: false }

const updateMembershipVariables = {
	projectSlug: GQLVariable.Required(GQLVariable.String),
	identityId: GQLVariable.Required(GQLVariable.String),
	memberships: GQLVariable.Required(GQLVariable.List(MembershipInput)),
}

export type UpdateMembershipErrorCodes =
	| 'PROJECT_NOT_FOUND'
	| 'NOT_MEMBER'
	| 'INVALID_MEMBERSHIP'

export const useUpdateProjectMembership = () =>
	useSingleTenantMutation<never, UpdateMembershipErrorCodes, typeof updateMembershipVariables>(
		UPDATE_MEMBERSHIP_QUERY,
		updateMembershipVariables,
	)
