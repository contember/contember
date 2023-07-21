import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { Size } from '../../../types'
import { toEnumViewClass, toViewClass } from '../../../utils'
import type { ButtonGroupFlow, ButtonGroupOrientation } from './Types'

export interface ButtonGroupProps extends ComponentClassNameProps {
	children?: ReactNode
	size?: Size
	orientation?: ButtonGroupOrientation
	flow?: ButtonGroupFlow
	isTopToolbar?: boolean
}

/**
 * @group UI
 */
export const ButtonGroup = memo(({ size, componentClassName = 'button-group', className, flow, orientation = 'horizontal', isTopToolbar, children }: ButtonGroupProps) => (
	<div
		data-orientation={dataAttribute(orientation)}
		data-flow={dataAttribute(flow)}
		data-size={dataAttribute(size)}
		className={useClassName(componentClassName, [
			toViewClass('isTopToolbar', isTopToolbar),
			className,
		])}
		role="group"
	>
		{children}
	</div>
))
ButtonGroup.displayName = 'Interface.ButtonGroup'
