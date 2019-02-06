import * as React from 'react'
import cn from 'classnames'

export enum AvatarSize {
	Size1 = 1,
	Size2 = 2,
	Size3 = 3,
	Size4 = 4,
	Size5 = 5
}

export enum AvatarShape {
	Circle = 'Circle',
	Square = 'Square'
}

export interface AvatarProps {
	size?: AvatarSize
	shape?: AvatarShape
}

export const Avatar: React.FunctionComponent<AvatarProps> = props => {
	const { size = AvatarSize.Size1, shape = AvatarShape.Circle, children } = props

	return (
		<div className={cn('avatar', `avatar-size${size}`, `avatar-shape${shape}`)}>
			{children && <span className="avatar-placeholder">{children}</span>}
		</div>
	)
}
