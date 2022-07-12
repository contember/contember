import classNames from 'classnames'
import { AllHTMLAttributes, DetailedHTMLProps, ForwardedRef, forwardRef, memo, OptionHTMLAttributes, ReactElement, RefAttributes, useCallback, useMemo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import type { ControlProps, ControlPropsKeys } from '../Types'
import { useNativeInput } from '../hooks/useNativeInput'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export interface SelectOption<V = string> {
	value: V
	label: string
	disabled?: boolean
}

export interface RestHTMLSelectProps<V> extends Omit<AllHTMLAttributes<HTMLSelectElement>, ControlPropsKeys<V> | 'children'> {}

export type SelectProps<V> = Omit<ControlProps<V>, 'min' | 'max'> & RestHTMLSelectProps<V> & {
	options: SelectOption<V>[]
	rows?: number
}

function optionValueIsEmpty (value: unknown) {
	return value === '' || value === null || typeof value === undefined
}

function deriveSelectIndexValue (index: number) {
	return index === -1 ? '' : index.toString()
}

const SelectComponent = <V extends any>({
	defaultValue,
	onChange,
	options,
	placeholder,
	value,
	rows,
	...outerProps
}: SelectProps<V>, forwardedRef: ForwardedRef<HTMLSelectElement>) => {
	const selectClassName = useComponentClassName('select')
	const wrapperClassName = `${selectClassName}-wrapper`

	const notNullOrRequired = outerProps.notNull || outerProps.required
	const displayBuiltinEmptyOption = !notNullOrRequired

	const inputProps = useTextBasedInput<HTMLSelectElement>({
		...outerProps,
		defaultValue: useMemo(() => defaultValue !== undefined
			? deriveSelectIndexValue(options.findIndex(option => option.value === defaultValue))
			: undefined, [defaultValue, options]),
		onChange: useCallback((index?: string | null) => {
			const next = typeof index === 'string'
				? options[parseInt(index)]?.value
				: null

			if (next !== value) {
				onChange?.(next)
			}
		}, [onChange, options, value]),
		value: useMemo(() => value !== undefined
			? deriveSelectIndexValue(options.findIndex(option => option.value === value))
			: undefined, [value, options]),
	}, forwardedRef)

	return (
		<div
			className={classNames(
				inputProps.className,
				wrapperClassName,
				rows && rows > 0 ? 'view-rows' : null,
			)}>
			<select
				{...inputProps}
				className={classNames(
					inputProps.className,
					selectClassName,
					rows && rows > 0 ? 'view-rows' : null,
				)} size={rows}>
				{displayBuiltinEmptyOption && <option key="-1" disabled={outerProps.required} value="">{placeholder ?? '…'}</option>}
				{options.map((option, index) => {
					const isEmptyOptionValue = optionValueIsEmpty(option.value)

					return <option
						key={index}
						value={deriveSelectIndexValue(isEmptyOptionValue ? -1 : index)}
						children={option.label}
						disabled={option.disabled || (outerProps.required && isEmptyOptionValue)}
					/>
				})}
			</select>
		</div>
	)
}

// memo(forwardRef()) causes `V` generic to cast as `unknown`
type MemoForwardRefComponentWithGenericProps = <A, B, R>(Component: (props: A, ref: ForwardedRef<R>) => B) => (props: A & RefAttributes<R>) => ReactElement | null
const memoizedForwardedComponentWithGenericProps: MemoForwardRefComponentWithGenericProps = <A, B, R>(Component: (props: A, ref: ForwardedRef<R>) => B) => ((memo(forwardRef(Component as any)) as any) as (props: A & RefAttributes<R>) => ReactElement | null)

export const Select = memoizedForwardedComponentWithGenericProps(SelectComponent) // as typeof SelectComponent
