import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { MembershipInput } from '../membership'

const INVITE_MUTATION = `
	invite(
		email: $email,
		projectSlug: $projectSlug,
		memberships: $memberships,
		options: { method: $method, mailVariant: $mailVariant },
	) {
		ok
		errors {
			code
		}
	}
`

export type InviteMethod = 'CREATE_PASSWORD' | 'RESET_PASSWORD'

const inviteVariables = {
	projectSlug: GQLVariable.Required(GQLVariable.String),
	email: GQLVariable.Required(GQLVariable.String),
	memberships: GQLVariable.Required(GQLVariable.List(MembershipInput)),
	method: GQLVariable.Enum<InviteMethod>('InviteMethod'),
	mailVariant: GQLVariable.String,
}

export type InviteErrorCodes =
	| 'PROJECT_NOT_FOUND'
	| 'ALREADY_MEMBER'
	| 'INVALID_MEMBERSHIP'

export const useInvite = () => {
	return useSingleTenantMutation<never, InviteErrorCodes, typeof inviteVariables>(
		INVITE_MUTATION,
		inviteVariables,
	)
}
