import * as React from 'react'
import cn from 'classnames'
import { useCallback } from 'react'

export interface HoverMenuItemProps {
	isActive: boolean
	onClick: () => void
}

export const HoverMenuItem: React.FC<HoverMenuItemProps> = props => {
	const onClick = useCallback(
		e => {
			e.preventDefault()
			props.onClick()
		},
		[props.onClick]
	)

	return (
		<div className={cn('hoverMenu-item', props.isActive && 'hoverMenu-isActive')} onMouseDown={onClick}>
			{props.children}
		</div>
	)
}
