import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { Size } from '../../../types'
import { toEnumViewClass } from '../../../utils'
import type { ButtonGroupOrientation, ButtonListFlow } from './Types'

export interface ButtonListProps {
	children?: ReactNode
	flow?: ButtonListFlow
	size?: Size
	orientation?: ButtonGroupOrientation
}

/**
 * @group UI
 */
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
