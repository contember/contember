import * as React from 'react'
import cn from 'classnames'
import { Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: React.ReactNode
	size?: Size
	isVertical?: boolean
	isTopToolbar?: boolean
}

export const ButtonGroup = React.memo(({ size, isVertical = false, isTopToolbar, children }: ButtonGroupProps) => (
	<div
		className={cn(
			'button-group',
			toEnumViewClass(size),
			toViewClass('vertical', isVertical),
			toViewClass('isTopToolbar', isTopToolbar),
		)}
		role="group"
	>
		{children}
	</div>
))

ButtonGroup.displayName = 'ButtonGroup'
