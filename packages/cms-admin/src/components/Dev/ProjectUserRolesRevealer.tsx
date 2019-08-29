import * as React from 'react'
import { useProjectUserRoles } from '../../acl'
import { isDevMode } from './isDevMode'

export const ProjectUserRolesRevealer = React.memo(() => {
	const myRoles = useProjectUserRoles()
	const hasRoles = myRoles.size !== 0

	if (!isDevMode()) {
		return null
	}

	console.log('roles', myRoles)

	return (
		<div style={{ marginLeft: '.75em' }}>
			{hasRoles || 'User has no roles'}
			{hasRoles && (
				<>
					Roles:{' '}
					{Array.from(myRoles).map(role => (
						<span>{role}</span>
					))}
				</>
			)}
		</div>
	)
})
