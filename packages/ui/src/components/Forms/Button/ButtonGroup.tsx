import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, fallback, isDefined } from '@contember/utilities'
import { memo } from 'react'
import { toViewClass } from '../../../utils'
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
	flow,
	inset,
	isTopToolbar,
	orientation,
	direction = 'horizontal',
	size = 'medium',
}: ButtonGroupProps) => {
	// TODO: deprecated since v1.3.0
	deprecate('1.3.0', isDefined(flow), '`flow` prop', '`display` prop')
	display = fallback(display, flow === 'block', 'block')

	deprecate('1.3.0', isDefined(isTopToolbar), '`isTopToolbar` prop', 'no alternative')

	deprecate('1.3.0', isDefined(orientation), '`orientation` prop', '`direction` prop')
	direction = fallback(direction, isDefined(orientation), orientation === 'default' || !orientation ? 'horizontal' : orientation)

	deprecate('1.3.0', size === 'default', 'size="default"', 'omitted `size` prop')
	size = fallback(size, size === 'default', 'medium')

	return (
		<div
			className={useClassName(componentClassName, [
				// TODO: remove in 1.3.0
				toViewClass('isTopToolbar', isTopToolbar),
				className,
			])}
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
