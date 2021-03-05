import { memo } from 'react'
import { useProjectUserRoles } from '../../acl'
import { isDevMode } from './isDevMode'

export const ProjectUserRolesRevealer = memo(() => {
	const myRoles = useProjectUserRoles()
	const hasRoles = myRoles.size !== 0

	if (!isDevMode()) {
		return null
	}

	return (
		<div style={{ marginLeft: '.75em' }}>
			{hasRoles || 'User has no roles'}
			{hasRoles && (
				<>
					Roles:{' '}
					{Array.from(myRoles).map(role => (
						<span key={role}>{role}</span>
					))}
				</>
			)}
		</div>
	)
})
