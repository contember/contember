import { useCallback } from 'react'
import { getTenantErrorMessage } from '@contember/client'
import { useRemoveProjectMembership } from '../hooks'
import { useShowToast } from '../../components'

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
				})
			} else {
				addToast({
					message: `Error removing member: ${result.removeProjectMember.errors
						.map(it => getTenantErrorMessage(it.code))
						.join(', ')}`,
					type: 'error',
				})
			}
			onRemove && await onRemove()
		},
		[addToast, project, onRemove, removeMemberInner],
	)
}
