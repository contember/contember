import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { forwardRef, memo, useCallback } from 'react'
import { mergeProps } from 'react-aria'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { NumberInputProps } from './Types'

/**
 * @group Forms UI
 */
export const NumberInput = memo(forwardRef<HTMLInputElement, NumberInputProps>(({
	className,
	defaultValue,
	focusRing = true,
	max,
	min,
	onChange,
	value,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
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
					.trim()
					.replace(/[^0-9-]|(?<!^)-/g, '')
					.replace(/^(-?)0+/, (match, p1) => p1 === '-' ? '-0' : '0')
				: null

			const int = value ? parseInt(value, 10) : null
			onChange?.(int === null || isNaN(int) ? null : int)
		}, [onChange]),
		value: value?.toString(10),
	}, forwardedRed)

	return <input
		data-focus-ring={dataAttribute(focusRing)}
		{...mergeProps(props, {
			onKeyDown: useCallback((event: KeyboardEvent) => {
				if (event.code === 'Period' || event.code === 'Comma') {
					event.preventDefault()
				}
			}, []),
		})}
		type="number"
	/>
}))
NumberInput.displayName = 'NumberInput'
