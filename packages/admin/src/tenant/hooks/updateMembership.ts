import { useCallback } from 'react'
import { useProjectSlug } from '@contember/react-client'
import { MutationRequestState, useAuthedTenantMutation } from './lib'

const UPDATE_MEMBERSHIP_QUERY = `
	mutation (
		$projectSlug: String!,
		$identityId: String!,
		$memberships: [MembershipInput!]!
	) {
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
	}
`

interface UpdateMembershipVariables {
	projectSlug: string
	identityId: string
	memberships: {
		role: string
		variables: { name: string; values: string[] }[]
	}[]
}

interface UpdateMembershipResult {
	updateProjectMember: {
		ok: boolean
		errors: { code: string }[]
	}
}

const useUpdateMembership = () =>
	useAuthedTenantMutation<UpdateMembershipResult, UpdateMembershipVariables>(UPDATE_MEMBERSHIP_QUERY)

export const useUpdateProjectMembership = (): [
	(
		project: string,
		identityId: string,
		memberships: UpdateMembershipVariables['memberships'],
	) => Promise<UpdateMembershipResult>,
	MutationRequestState<UpdateMembershipResult>,
] => {
	const [update, state] = useUpdateMembership()
	const cb = useCallback(
		(project: string, identityId: string, memberships: UpdateMembershipVariables['memberships']) => {
			if (update) {
				return update({
					projectSlug: project,
					identityId,
					memberships,
				})
			}
			return Promise.reject()
		},
		[update],
	)
	return [cb, state]
}

export const useUpdateCurrentProjectMembership = (): [
	(identityId: string, memberships: UpdateMembershipVariables['memberships']) => Promise<UpdateMembershipResult>,
	MutationRequestState<UpdateMembershipResult>,
] => {
	const project = useProjectSlug()
	const [update, state] = useUpdateProjectMembership()
	const cb = useCallback(
		(identityId: string, memberships: UpdateMembershipVariables['memberships']) => {
			if (project !== undefined) {
				return update(project, identityId, memberships)
			}
			return Promise.reject()
		},
		[project, update],
	)
	return [cb, state]
}
