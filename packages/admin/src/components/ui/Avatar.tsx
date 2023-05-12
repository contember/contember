import { listClassName } from '@contember/utilities'
import md5 from 'blueimp-md5'
import type { FunctionComponent } from 'react'

export interface AvatarProps {
	size?: 1 | 2 | 3 | 4 | 5
	shape?: 'Circle' | 'Square'
	email?: string
}

/**
 * @group UI
 */
export const Avatar: FunctionComponent<AvatarProps> = props => {
	const { size = 1, shape = 'Circle' } = props
	const email = props.email || ''

	return (
		<div className={listClassName(['avatar', `avatar-size${size}`, `avatar-shape${shape}`])}>
			{
				<img
					className="avatar-image"
					src={`https://s.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=${size * 40}&d=mp`}
					alt={email.substring(0, 1).toUpperCase()}
				/>
			}
		</div>
	)
}
