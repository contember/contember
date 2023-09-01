import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, fallback, isDefined } from '@contember/utilities'
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
	flow,
	gap = true,
	inset,
	orientation,
	direction = 'horizontal',
	size = 'medium',
}: ButtonListProps) => {
	// TODO: deprecated since v1.3.0
	deprecate('1.3.0', isDefined(flow), '`flow` prop', '`display` prop')
	display = fallback(display, flow === 'block', 'block')

	deprecate('1.3.0', isDefined(orientation), '`orientation` prop', '`direction` prop')
	direction = fallback(direction, isDefined(orientation), orientation === 'default' || !orientation ? 'horizontal' : orientation)

	deprecate('1.3.0', size === 'default', 'size="default"', 'omitted `size` prop')
	size = fallback(size, size === 'default', 'medium')

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
