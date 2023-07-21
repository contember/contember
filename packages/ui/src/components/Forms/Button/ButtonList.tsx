import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import { Size } from '../../../types'
import { toEnumViewClass } from '../../../utils'
import type { ButtonGroupOrientation, ButtonListFlow } from './Types'

export interface ButtonListProps extends ComponentClassNameProps {
	children?: ReactNode
	flow?: ButtonListFlow
	size?: Size
	orientation?: ButtonGroupOrientation
}

/**
 * @group UI
 */
export const ButtonList = memo(({ children, className, componentClassName = 'button-list', flow, orientation = 'horizontal', size }: ButtonListProps) => (
	<div
		data-orientation={dataAttribute(orientation)}
		data-flow={dataAttribute(flow)}
		data-size={dataAttribute(size)}
		className={useClassName(componentClassName, className)}
		role="group"
	>
		{children}
	</div>
))
ButtonList.displayName = 'Interface.ButtonList'
