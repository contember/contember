import classNames from 'classnames'
import { forwardRef, memo, useCallback, useRef } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import type { FloatInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

/**
 * @group Forms UI
 */
export const FloatInput = memo(forwardRef<HTMLInputElement, FloatInputProps>(({
	className,
	defaultValue,
	onChange,
	max,
	min,
	value,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const number = useRef<string>()

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: classNames(
			useComponentClassName('text-input'),
			useComponentClassName('number-input'),
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		),
		defaultValue: defaultValue?.toString(10),
		max: max?.toString(10),
		min: min?.toString(10),
		onChange: useCallback((value?: string | null) => {
			value = typeof value === 'string' && value.trim() !== ''
			? (value)
				.replaceAll(',', '.')
				.replace(/[^\d.-]/g, '')
				.replace(/^(\d+\.\d+|\d+).*/, '$1')
				.replace(/^0*(?=\d)/, '')
			: ''

			if (number.current !== value) {
				number.current = value
				onChange?.(value ? parseFloat(value) : null)
			}
		}, [onChange]),
		value: value?.toString(10),
	}, forwardedRed)

	return <input {...props} type="number" step={outerProps.step ?? 'any'} />
}))
FloatInput.displayName = 'FloatInput'
