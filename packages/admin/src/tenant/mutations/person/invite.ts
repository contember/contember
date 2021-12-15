import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { MembershipInput } from '../membership'

const INVITE_MUTATION = `
	invite(
		email: $email,
		projectSlug: $projectSlug,
		memberships: $memberships
	) {
		ok
		errors {
			code
		}
	}
`

const inviteVariables = {
	projectSlug: GQLVariable.Required(GQLVariable.String),
	email: GQLVariable.Required(GQLVariable.String),
	memberships: GQLVariable.Required(GQLVariable.List(MembershipInput)),
}

type InviteErrorCodes =
	| 'PROJECT_NOT_FOUND'
	| 'ALREADY_MEMBER'
	| 'INVALID_MEMBERSHIP'

export const useInvite = () => useSingleTenantMutation<never, InviteErrorCodes, typeof inviteVariables>(INVITE_MUTATION, inviteVariables)
