import { getTenantErrorMessage } from '@contember/client'
import { useShowToast } from '@contember/ui'
import { useCallback } from 'react'
import { useRemoveProjectMembership } from '../../mutations'

export const useRemoveMemberIntent = (project: string, onRemove?: () => void | Promise<void>) => {
	const [removeMemberInner] = useRemoveProjectMembership()
	const addToast = useShowToast()

	return useCallback(
		async (id: string) => {
			const confirmed = confirm('Do you want to remove member from project?')
			if (!confirmed) {
				return
			}
			const result = await removeMemberInner(project, id)
			if (result.removeProjectMember.ok) {
				addToast({
					message: `Member removed`,
					type: 'success',
					dismiss: true,
				})
			} else {
				addToast({
					message: `Error removing member: ${result.removeProjectMember.errors
						.map(it => getTenantErrorMessage(it.code))
						.join(', ')}`,
					type: 'error',
					dismiss: true,
				})
			}
			onRemove && await onRemove()
		},
		[addToast, project, onRemove, removeMemberInner],
	)
}
