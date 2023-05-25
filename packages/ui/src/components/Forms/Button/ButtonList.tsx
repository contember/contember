import { useClassName } from '@contember/utilities'
import { memo, ReactNode } from 'react'
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
	<div
		className={useClassName('button-list', [
			toEnumViewClass(size),
			toEnumViewClass(orientation, 'horizontal'),
			toEnumViewClass(flow, 'inline'),
		])}
		role="group"
	>
		{children}
	</div>
))
ButtonList.displayName = 'ButtonList'
