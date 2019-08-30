import * as React from 'react'
import cn from 'classnames'
import { ButtonGroupOrientation, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
	orientation?: ButtonGroupOrientation
	isTopToolbar?: boolean
}

export const ButtonGroup = React.memo(({ size, orientation, isTopToolbar, children }: ButtonGroupProps) => (
	<div
		className={cn(
			'button-group',
			toEnumViewClass(size),
			toEnumViewClass(orientation, 'horizontal'),
			toViewClass('isTopToolbar', isTopToolbar),
		)}
		role="group"
	>
		{children}
	</div>
))

ButtonGroup.displayName = 'ButtonGroup'
