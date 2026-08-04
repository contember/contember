import { ReactElement, useCallback } from 'react'
import { RemoveProjectMemberErrorCode } from '@contember/graphql-client-tenant'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { RemoveProjectMemberMutationVariables, useRemoveProjectMemberMutation } from '../../hooks/index.js'

export type RemoveProjectMemberTriggerProps =
	& RemoveProjectMemberMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (args: TenantActionErrorArgs<RemoveProjectMemberErrorCode>) => void
	}

export const RemoveProjectMemberTrigger = ({ identityId, projectSlug, ...props }: RemoveProjectMemberTriggerProps) => {
	const removeProjectMember = useRemoveProjectMemberMutation()
	const execute = useCallback(async () => await removeProjectMember({ projectSlug, identityId }), [identityId, projectSlug, removeProjectMember])
	return <TenantActionTrigger {...props} execute={execute} />
}
