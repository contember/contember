import { useClassNameFactory } from '@contember/react-utils'
import { AllHTMLAttributes, DetailedHTMLProps, InputHTMLAttributes, forwardRef, memo, useCallback } from 'react'
import { mergeProps, useFocusRing, useHover } from 'react-aria'
import { toStateClass } from '../../../utils'
import { useCheckboxInput } from '../Hooks'
import { ControlProps, ControlPropsKeys } from '../Types'
import { CheckboxButton as DefaultCheckboxButton } from './CheckboxButton'

export interface RestHTMLCheckboxProps extends Omit<AllHTMLAttributes<HTMLInputElement>, ControlPropsKeys<boolean> | 'checked' | 'children'> { }

export type CheckboxOwnProps = ControlProps<boolean> & {
	CheckboxButtonComponent?: typeof DefaultCheckboxButton
	/**
	 * @deprecated Add `<Label>` next to it or wrap with `<FieldContainer>`
	 *
	 */
	children?: never
}

export type CheckboxProps = CheckboxOwnProps & RestHTMLCheckboxProps

/**
 * To add label to checkbox, use `Label` component next to it or wrap with `FieldContainer` or other way to display label next to Checkbox.
 *
 * @group Forms UI
 *
 * @example
 * ```
 * <FieldContainer display="inline" label={label} labelPosition="right">
 * 	<Checkbox {...} />
 * </FieldContainer>
 * ```
 */
export const Checkbox = memo(forwardRef<HTMLInputElement, CheckboxProps>(({
	CheckboxButtonComponent,
	// NOTE: Children are not allowed on Checkbox
	children: INTENTIONALLY_UNUSED_CHILDREN,
	max,
	min,
	onChange,
	value,
	...outerProps
}, forwardedRef) => {
	if (import.meta.env.DEV && INTENTIONALLY_UNUSED_CHILDREN) {
		console.warn('[UNUSED CHILDREN] Add `<Label>` next to it or wrap with '
			+ '`<FieldContainer display="inline" label={label} labelPosition="right"><Checkbox {...} /></FieldContainer>` '
			+ 'or other way to display label next to Checkbox.')
	}

	const componentClassName = useClassNameFactory('checkbox')
	const notNull = outerProps.notNull

	const onChangeRotateState = useCallback((next?: boolean | null) => {
		if (!notNull) {
			if (value === false && next === true) {
				next = null
			} else if (value === null) {
				next = true
			}
		}

		onChange?.(next)
	}, [value, notNull, onChange])

	const props = useCheckboxInput({
		...outerProps,
		onChange: onChangeRotateState,
		defaultValue: outerProps.defaultValue,
		value,
	}, forwardedRef)

	const { className, indeterminate, ...nativeInputProps } = props

	const { isFocusVisible: focused, focusProps } = useFocusRing()
	const { isHovered: hovered, hoverProps } = useHover({ isDisabled: props.disabled })

	const ariaProps: {
		'aria-checked': DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>['aria-checked']
	} = {
		'aria-checked': indeterminate ? 'mixed' : nativeInputProps.checked ? 'true' : 'false',
	}

	const CheckboxButton = CheckboxButtonComponent ?? DefaultCheckboxButton

	return (
		<div {...hoverProps} className={componentClassName(null, [
			toStateClass('indeterminate', props.indeterminate),
			toStateClass('checked', props.checked),
			className,
		])}>
			<input
				type="checkbox"
				{...mergeProps(
					nativeInputProps,
					ariaProps,
					focusProps,
				)}
				className={componentClassName('visually-hidden')}
			/>

			<CheckboxButton
				id={outerProps.id}
				placeholder={undefined}
				name={outerProps.name}
				active={outerProps.active}
				checked={props.checked}
				className={className}
				disabled={outerProps.disabled}
				distinction={outerProps.distinction}
				focused={focused}
				hovered={hovered}
				indeterminate={props.indeterminate}
				intent={outerProps.intent}
				loading={outerProps.loading}
				readOnly={outerProps.readOnly}
				required={outerProps.required}
				scheme={outerProps.scheme}
				size={outerProps.size}
				validationState={outerProps.validationState}
				style={outerProps.style}
			/>
		</div>
	)
}))
Checkbox.displayName = 'Checkbox'
