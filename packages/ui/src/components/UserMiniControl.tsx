import { useClassNameFactory } from '@contember/utilities'
import type { FunctionComponent, ReactNode } from 'react'

export interface UserMiniControlProps {
	avatarUrl?: string
	name: ReactNode
	note?: ReactNode
}

/**
 * @group UI
 */
export const UserMiniControl: FunctionComponent<UserMiniControlProps> = ({ name, note, avatarUrl }) => {
	const componentClassName = useClassNameFactory('userMiniControl')

	return (
		<div className={componentClassName()}>
			{avatarUrl && (
				<div className={componentClassName('avatar')}>
					<img src={avatarUrl} className={componentClassName('avatar-img')} alt="" />
				</div>
			)}
			<div className={componentClassName('info')}>
				<span className={componentClassName('name')}>{name}</span>
				{note && <span className={componentClassName('note')}>{note}</span>}
			</div>
		</div>
	)
}
UserMiniControl.displayName = 'UserMiniControl'
