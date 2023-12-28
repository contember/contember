import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import type { ButtonListProps } from './Types'

/**
 * @group UI
 */
export const ButtonList = memo(({
	children,
	className,
	componentClassName = 'button-list',
	display = 'inline',
	gap = true,
	inset,
	direction = 'horizontal',
	size = 'medium',
}: ButtonListProps) => {
	return (
		<div
			className={useClassName(componentClassName, className)}
			data-direction={dataAttribute(direction)}
			data-display={dataAttribute(display)}
			data-gap={dataAttribute(gap)}
			data-inset={dataAttribute(inset)}
			data-size={dataAttribute(size)}
			role="group"
		>
			{children}
		</div>
	)
})
ButtonList.displayName = 'Interface.ButtonList'
