import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
import { forwardRef, memo, useCallback, useRef } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { FloatInputProps } from './Types'

/**
 * @group Forms UI
 */
export const FloatInput = memo(forwardRef<HTMLInputElement, FloatInputProps>(({
	className,
	defaultValue,
	onChange,
	focusRing = true,
	max,
	min,
	value,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

	const number = useRef<string>()

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'number-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
		defaultValue: defaultValue?.toString(10),
		max: max?.toString(10),
		min: min?.toString(10),
		onChange: useCallback((value?: string | null) => {
			value = typeof value === 'string' && value.trim() !== ''
				? (value)
					.replaceAll(',', '.')
					.replace(/[^\d.-]/g, '')
					.replace(/^(-?\d+\.\d+|\d+).*/, '$1')
					.replace(/^(-?)0+/, (match, p1) => p1 === '-' ? '-0' : '0')
				: ''

			if (number.current !== value) {
				number.current = value
				onChange?.(value ? parseFloat(value) : null)
			}
		}, [onChange]),
		value: value?.toString(10),
	}, forwardedRed)

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="number" step={outerProps.step ?? 'any'} />
}))
FloatInput.displayName = 'FloatInput'
