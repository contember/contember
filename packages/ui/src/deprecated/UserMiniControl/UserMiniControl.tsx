import { useClassNameFactory } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import type { FunctionComponent, ReactNode } from 'react'

/** @deprecated No alternative since 1.4.0 */
export interface UserMiniControlProps {
	avatarUrl?: string
	name: ReactNode
	note?: ReactNode
}

/**
 * @group UI
 * @deprecated No alternative since 1.4.0
 */
export const UserMiniControl: FunctionComponent<UserMiniControlProps> = ({ name, note, avatarUrl }) => {
	deprecate('1.4.0', true, 'UserMiniControl', null)
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
