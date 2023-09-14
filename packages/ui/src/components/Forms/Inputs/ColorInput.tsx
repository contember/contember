import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import { assertColorString } from '../Types'
import type { ColorInputProps } from './Types'

/**
 * @group Forms UI
 */
export const ColorInput = memo(forwardRef<HTMLInputElement, ColorInputProps>(({
	className,
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

	outerProps.value && assertColorString(outerProps.value)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'color-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="color" />
}))
ColorInput.displayName = 'ColorInput'
