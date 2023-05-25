import { useClassName } from '@contember/utilities'
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
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	outerProps.value && assertColorString(outerProps.value)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'color-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="color" />
}))
ColorInput.displayName = 'ColorInput'
