import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
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
		className: classNames(
			useComponentClassName('text-input'),
			useComponentClassName('color-input'),
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		),
	}, forwardedRed)

	return <input {...props} type="color" />
}))
ColorInput.displayName = 'ColorInput'
