import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import type { ButtonGroupProps } from './Types'

/**
 * @group UI
 */
export const ButtonGroup = memo(({
	borderRadius = true,
	children,
	className,
	componentClassName = 'button-group',
	display = 'inline',
	focusRing = false,
	inset,
	direction = 'horizontal',
	size = 'medium',
}: ButtonGroupProps) => {
	return (
		<div
			className={useClassName(componentClassName, className)}
			data-border-radius={dataAttribute(borderRadius)}
			data-direction={dataAttribute(direction)}
			data-display={dataAttribute(display)}
			data-focus-ring={dataAttribute(focusRing)}
			data-inset={dataAttribute(inset)}
			data-size={dataAttribute(size)}
			role="group"
		>
			{children}
		</div>
	)
})
ButtonGroup.displayName = 'Interface.ButtonGroup'
