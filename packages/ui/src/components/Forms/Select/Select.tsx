import { useClassName } from '@contember/utilities'
import { ComponentProps, CSSProperties, ForwardedRef, forwardRef, memo, ReactElement, RefAttributes, useCallback, useMemo, useRef } from 'react'
import ReactSelect, { SelectInstance, StylesConfig, useStateManager } from 'react-select'
import { noop } from '../../../utils'
import { getPortalRoot } from '../../Portal'
import { useChangeValidationState, useInputClassName } from '../Hooks'
import type { ControlConstraintProps, ControlProps } from '../Types'
import { useCommonReactSelectStyles } from './useCommonReactSelectStyles'

export interface SelectOption<V = string> {
	key?: string
	value: V
	label: string
	disabled?: boolean
}

export type SelectOptionWithKey<V = string> =
	& Omit<SelectOption<V>, 'key'>
	& { key: string }

export type HTMLReactSelectElement<V> = SelectInstance<SelectOption<V>, false, never>
export type HTMLReactSelectElementWithKey<V> = SelectInstance<SelectOptionWithKey<V>, false, never>

export type SelectProps<V> = Omit<ControlProps<V>, 'type' | 'style' | keyof ControlConstraintProps<any>> & {
	options: SelectOption<V>[]
	/**
	 * @deprecated No need for React Select component.
	 */
	rows?: never
	isSearchable?: ComponentProps<ReactSelect>['isSearchable']
	styles?: StylesConfig<any, boolean, never>
}

function optionValueIsEmpty(value: unknown) {
	return value === '' || value === null || typeof value === undefined
}

function deriveSelectIndexValue(index: number) {
	return index === -1 ? '' : index.toString()
}

const SelectComponent = <V = unknown>({
	active,
	className: outerClassName,
	defaultValue: defaultValueProp,
	disabled,
	distinction,
	focused,
	hovered,
	id,
	intent,
	isSearchable = false,
	loading,
	name,
	notNull,
	onBlur,
	onChange,
	onFocus,
	onFocusChange,
	onValidationStateChange,
	options,
	placeholder,
	readOnly,
	required,
	rows,
	scheme,
	size,
	styles,
	validationState,
	value: valueProp,

	...outerProps
}: SelectProps<V>, forwardedRef: ForwardedRef<HTMLReactSelectElement<V>>) => {
	if (import.meta.env.DEV) {
		// Spread fixes TS error "Index signature for type 'string' is missing in type '{ }'."
		const _exhaust: { [key: string]: never } = { ...outerProps }
	}

	const className = useInputClassName({
		// ControlStateProps
		active,
		disabled,
		loading,
		readOnly,
		required,
		focused,
		hovered,

		// ControlDisplayProps
		className: outerClassName,
		distinction,
		intent,
		scheme,
		size,

		// ValidationStateProps
		validationState,
	})
	const defaultStyles = useCommonReactSelectStyles<any, boolean, never>({})

	const getOptionLabel = useCallback((option: SelectOption<V>) => option.label, [])
	const getOptionValue = useCallback((option: SelectOptionWithKey<V>) => option.key, [])
	const isOptionDisabled = useCallback((option: SelectOption<V>) => !!option.disabled, [])

	const optionsWithKeys: SelectOptionWithKey<V>[] = useMemo(() => options.map(
		(option, key) => ({ key: deriveSelectIndexValue(key), ...option }),
	), [options])

	const defaultValue = useMemo(() => defaultValueProp !== undefined
		? optionsWithKeys.find(option => option.value === defaultValueProp)
		: undefined, [defaultValueProp, optionsWithKeys])

	const value = useMemo(() => valueProp !== undefined
		? optionsWithKeys.find(option => option.value === valueProp)
		: undefined, [valueProp, optionsWithKeys])

	const defaultInputValue = defaultValue?.label

	const nativeValidationInput = useRef<HTMLInputElement>(null)
	useChangeValidationState({ ref: nativeValidationInput, onValidationStateChange })

	const reactSelectState = useStateManager<SelectOptionWithKey<V>, false, never, {}>({
		defaultInputValue,
		defaultValue,
		onChange: newValue => {
			const next = newValue?.value

			if (valueProp !== next) {
				if (nativeValidationInput.current) {
					nativeValidationInput.current.value = optionsWithKeys.find(option => option.value === next)?.key ?? ''
				}
				onChange?.(next)
			}
		},
		onBlur: () => {
			onBlur?.()
			onFocusChange?.(false)
		},
		onFocus: () => {
			onFocus?.()
			onFocusChange?.(true)
		},
		value,
	})

	return <>
		<ReactSelect
			isSearchable={isSearchable}
			className={useClassName('select', className)}
			defaultValue={defaultValue}
			getOptionLabel={getOptionLabel}
			getOptionValue={getOptionValue}
			id={id}
			isClearable={!required && !notNull}
			isDisabled={disabled || readOnly || loading}
			isLoading={loading}
			isOptionDisabled={isOptionDisabled}
			menuPortalTarget={getPortalRoot()}
			name={name}
			options={optionsWithKeys}
			placeholder={placeholder}
			ref={forwardedRef as ForwardedRef<HTMLReactSelectElementWithKey<V>>}
			{...reactSelectState}
			styles={{
				...defaultStyles,
				...styles,
			}}
		/>
		<input
			ref={nativeValidationInput}
			value={value?.key ?? ''}
			onChange={noop}
			tabIndex={-1}
			required={required || notNull}
			style={nativeValidationInputStyle} />
	</>
}

const nativeValidationInputStyle: CSSProperties = {
	border: 0,
	clipPath: 'inset(50%)',
	height: 0,
	padding: 0,
	pointerEvents: 'none',
	position: 'absolute',
	width: 0,
}

// memo(forwardRef()) causes `V` generic to cast as `unknown`
type MemoForwardRefComponentWithGenericProps = <A, B, R>(Component: (props: A, ref: ForwardedRef<R>) => B) => (props: A & RefAttributes<R>) => ReactElement | null
const memoizedForwardedComponentWithGenericProps: MemoForwardRefComponentWithGenericProps = <A, B, R>(Component: (props: A, ref: ForwardedRef<R>) => B) => ((memo(forwardRef(Component as any)) as any) as (props: A & RefAttributes<R>) => ReactElement | null)

/**
 * @group Forms UI
 */
export const Select = memoizedForwardedComponentWithGenericProps(SelectComponent) // as typeof SelectComponent
