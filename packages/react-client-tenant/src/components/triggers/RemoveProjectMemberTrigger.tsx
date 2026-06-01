import { ReactElement, useCallback } from 'react'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { RemoveProjectMemberMutationVariables, useRemoveProjectMemberMutation } from '../../hooks/index.js'

export type RemoveProjectMemberTriggerProps =
	& RemoveProjectMemberMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (e: unknown) => void
	}

export const RemoveProjectMemberTrigger = ({ identityId, projectSlug, ...props }: RemoveProjectMemberTriggerProps) => {
	const removeProjectMember = useRemoveProjectMemberMutation()
	const execute = useCallback(async () => await removeProjectMember({ projectSlug, identityId }), [identityId, projectSlug, removeProjectMember])
	return <TenantActionTrigger {...props} execute={execute} />
}
