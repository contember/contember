import { useProjectSlug } from '@contember/react-client'
import { useCallback } from 'react'
import { MutationRequestState, useAuthedTenantMutation } from '../../lib'

const UPDATE_MEMBERSHIP_QUERY = `
	mutation (
		$projectSlug: String!,
		$identityId: String!
	) {
		removeProjectMember(
			projectSlug: $projectSlug,
			identityId: $identityId
		) {
			ok
			errors {
				code
			}
		}
	}
`

export interface UpdateMembershipVariables {
	projectSlug: string
	identityId: string
}

export interface UpdateMembershipResult {
	removeProjectMember: {
		ok: boolean
		errors: { code: string }[]
	}
}

const useRemoveMembership = () =>
	useAuthedTenantMutation<UpdateMembershipResult, UpdateMembershipVariables>(UPDATE_MEMBERSHIP_QUERY)

export const useRemoveProjectMembership = (): [
	(project: string, identityId: string) => Promise<UpdateMembershipResult>,
	MutationRequestState<UpdateMembershipResult>,
] => {
	const [update, state] = useRemoveMembership()
	const cb = useCallback(
		(project: string, identityId: string) => {
			if (update) {
				return update({
					projectSlug: project,
					identityId,
				})
			}
			return Promise.reject()
		},
		[update],
	)
	return [cb, state]
}

export const useRemoveCurrentProjectMembership = (): [
	(identityId: string) => Promise<UpdateMembershipResult>,
	MutationRequestState<UpdateMembershipResult>,
] => {
	const project = useProjectSlug()
	const [update, state] = useRemoveProjectMembership()
	const cb = useCallback(
		(identityId: string) => {
			if (project !== undefined) {
				return update(project, identityId)
			}
			return Promise.reject()
		},
		[project, update],
	)
	return [cb, state]
}
