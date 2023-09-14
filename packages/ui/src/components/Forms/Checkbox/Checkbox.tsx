import { useClassNameFactory } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { AllHTMLAttributes, DetailedHTMLProps, InputHTMLAttributes, forwardRef, memo, useCallback } from 'react'
import { mergeProps, useFocusRing, useHover } from 'react-aria'
import { toStateClass } from '../../../utils'
import { useCheckboxInput } from '../Hooks'
import { ControlProps, ControlPropsKeys } from '../Types'
import { CheckboxButton as DefaultCheckboxButton } from './CheckboxButton'

export interface RestHTMLCheckboxProps extends Omit<AllHTMLAttributes<HTMLInputElement>, ControlPropsKeys<boolean> | 'checked' | 'children'> { }

export type CheckboxOwnProps = Omit<ControlProps<boolean>, 'min' | 'max'> & {
	CheckboxButtonComponent?: typeof DefaultCheckboxButton
}

/** @deprecated No alternative since 1.4.0 */
export type DeprecatedCheckboxProps = {
	/** @deprecated No use for boolean checkboxes, no alternative since 1.4.0 */
	min?: ControlProps<boolean>['min']
	/** @deprecated No use for boolean checkboxes, no alternative since 1.4.0 */
	max?: ControlProps<boolean>['max']
}

export type CheckboxProps =
	& Omit<RestHTMLCheckboxProps, keyof CheckboxOwnProps | keyof DeprecatedCheckboxProps>
	& Omit<CheckboxOwnProps, keyof RestHTMLCheckboxProps>
	& DeprecatedCheckboxProps

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
	max,
	min,
	onChange,
	value,
	...outerProps
}, forwardedRef) => {
	const componentClassName = useClassNameFactory('checkbox')
	const notNull = outerProps.notNull

	deprecate('1.4.0', min !== undefined, '`min` prop', null)
	deprecate('1.4.0', max !== undefined, '`max` prop', null)

	const onChangeRotateState = useCallback((next?: boolean | null) => {
		if (!notNull) {
			if (value === false && next === true) {
				next = null
			} else if (value === null) {
				next = true
			}
		}

		if (next !== undefined) {
			onChange?.(next)
		}
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
