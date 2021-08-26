import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { ButtonGroupOrientation, ButtonListFlow, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface ButtonListProps {
	children?: ReactNode
	flow?: ButtonListFlow
	size?: Size
	orientation?: ButtonGroupOrientation
}

export const ButtonList = memo(({ children, flow, orientation, size }: ButtonListProps) => (
	<div className={cn(
		useComponentClassName('button-list'),
		toEnumViewClass(size),
		toEnumViewClass(orientation, 'horizontal'),
		toEnumViewClass(flow, 'inline'),
	)} role="group">
		{children}
	</div>
))
ButtonList.displayName = 'ButtonList'
