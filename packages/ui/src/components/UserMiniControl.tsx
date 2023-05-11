import cn from 'classnames'
import type { FunctionComponent, ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface UserMiniControlProps {
	avatarUrl?: string
	name: ReactNode
	note?: ReactNode
}

/**
 * @group UI
 */
export const UserMiniControl: FunctionComponent<UserMiniControlProps> = ({ name, note, avatarUrl }) => {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}userMiniControl`)}>
			{avatarUrl && (
				<div className={`${prefix}userMiniControl-avatar`}>
					<img src={avatarUrl} className={`${prefix}userMiniControl-avatar-img`} alt="" />
				</div>
			)}
			<div className={`${prefix}userMiniControl-info`}>
				<span className={`${prefix}userMiniControl-name`}>{name}</span>
				{note && <span className={`${prefix}userMiniControl-note`}>{note}</span>}
			</div>
		</div>
	)
}
UserMiniControl.displayName = 'UserMiniControl'
