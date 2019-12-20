import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { ButtonGroupFlow, ButtonGroupOrientation, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
	orientation?: ButtonGroupOrientation
	flow?: ButtonGroupFlow
	isTopToolbar?: boolean
}

export const ButtonGroup = React.memo(({ size, flow, orientation, isTopToolbar, children }: ButtonGroupProps) => (
	<div
		className={cn(
			useComponentClassName('button-group'),
			toEnumViewClass(size),
			toEnumViewClass(flow),
			toEnumViewClass(orientation, 'horizontal'),
			toViewClass('isTopToolbar', isTopToolbar),
		)}
		role="group"
	>
		{children}
	</div>
))
ButtonGroup.displayName = 'ButtonGroup'
