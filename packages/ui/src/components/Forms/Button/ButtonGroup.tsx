import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import type { Size } from '../../../types'
import { toEnumViewClass, toViewClass } from '../../../utils'
import type { ButtonGroupFlow, ButtonGroupOrientation } from './Types'

export interface ButtonGroupProps {
	children?: ReactNode
	size?: Size
	orientation?: ButtonGroupOrientation
	flow?: ButtonGroupFlow
	isTopToolbar?: boolean
}

/**
 * @group UI
 */
export const ButtonGroup = memo(({ size, flow, orientation, isTopToolbar, children }: ButtonGroupProps) => (
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
