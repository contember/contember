import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, fallback, isDefined } from '@contember/utilities'
import { memo } from 'react'
import { toViewClass } from '../../../utils'
import type { ButtonGroupProps } from './Types'

/**
 * @group UI
 */
export const ButtonGroup = memo(({
	children,
	className,
	componentClassName = 'button-group',
	display = 'inline',
	flow,
	isTopToolbar,
	orientation = 'horizontal',
	size = 'medium',
}: ButtonGroupProps) => {
	// TODO: deprecated since v1.3.0
	deprecate('1.3.0', isDefined(flow), '`flow` prop', '`display` prop')
	display = fallback(display, flow === 'block', 'block')

	deprecate('1.3.0', isDefined(isTopToolbar), '`isTopToolbar` prop', 'no alternative')

	deprecate('1.3.0', orientation === 'default', 'orientation="default"', 'omitted `orientation` prop')
	orientation = fallback(orientation, orientation === 'default', 'horizontal')

	deprecate('1.3.0', size === 'default', 'size="default"', 'omitted `size` prop')
	size = fallback(size, size === 'default', 'medium')

	return (
		<div
			data-display={dataAttribute(display)}
			data-orientation={dataAttribute(orientation)}
			data-size={dataAttribute(size)}
			className={useClassName(componentClassName, [
				// TODO: remove in 1.3.0
				toViewClass('isTopToolbar', isTopToolbar),
				className,
			])}
			role="group"
		>
			{children}
		</div>
	)
})
ButtonGroup.displayName = 'Interface.ButtonGroup'
