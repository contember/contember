import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import cn from 'classnames'
import md5 from 'blueimp-md5'

export enum AvatarSize {
	Size1 = 1,
	Size2 = 2,
	Size3 = 3,
	Size4 = 4,
	Size5 = 5,
}

export enum AvatarShape {
	Circle = 'Circle',
	Square = 'Square',
}

export interface AvatarProps {
	size?: AvatarSize
	shape?: AvatarShape
	email?: string
}

export const Avatar: FunctionComponent<AvatarProps> = props => {
	const { size = AvatarSize.Size1, shape = AvatarShape.Circle } = props
	const email = props.email || ''

	return (
		<div className={cn('avatar', `avatar-size${size}`, `avatar-shape${shape}`)}>
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
