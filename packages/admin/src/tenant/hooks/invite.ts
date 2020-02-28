import { MutationRequestState, useAuthedTenantMutation } from './lib'
import * as React from 'react'

const INVITE_MUTATION = `
	mutation (
		$email: String!,
		$projectSlug: String!,
		$memberships: [MembershipInput!]!
	) {
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
	}
`

interface CreateUserMutationResult {
	invite: {
		ok: boolean
		errors: { code: string }[]
	}
}

interface InviteMembershipInput {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}

interface CreateUserMutationVariables {
	email: string
	projectSlug: string
	memberships: InviteMembershipInput[]
}

export const useInvite = (
	project: string,
): [
	(email: string, memberships: InviteMembershipInput[]) => Promise<CreateUserMutationResult>,
	MutationRequestState<CreateUserMutationResult>,
] => {
	const [addUser, state] = useAuthedTenantMutation<CreateUserMutationResult, CreateUserMutationVariables>(
		INVITE_MUTATION,
	)
	const cb = React.useCallback(
		(email: string, memberships: InviteMembershipInput[]) => {
			return addUser({
				email,
				memberships,
				projectSlug: project,
			})
		},
		[addUser, project],
	)

	return [cb, state]
}
