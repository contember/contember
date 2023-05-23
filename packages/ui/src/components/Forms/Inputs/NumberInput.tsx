import classNames from 'classnames'
import { forwardRef, memo, useCallback } from 'react'
import { mergeProps } from 'react-aria'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { NumberInputProps } from './Types'

/**
 * @group Forms UI
 */
export const NumberInput = memo(forwardRef<HTMLInputElement, NumberInputProps>(({
	className,
	defaultValue,
	max,
	min,
	onChange,
	value,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
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
					.replace(/[^\d]/g, '')
					.replace(/^0*(?=\d)/, '')
				: null

			onChange?.(value ? parseInt(value) : null)
		}, [onChange]),
		value: value?.toString(10),
	}, forwardedRed)

	return <input
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
