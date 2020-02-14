import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'

export interface UserMiniControlProps {}

export function UserMiniControl({}: UserMiniControlProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}userMiniControl`)}>
			<span className={`${prefix}userMiniControl-name`}>Honza sládek</span>
			<span className={`${prefix}userMiniControl-note`}>Superadministrátor</span>
		</div>
	)
}
UserMiniControl.displayName = 'UserMiniControl'
