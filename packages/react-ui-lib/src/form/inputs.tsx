import { Component, Field } from '@contember/interface'
import {
	FormCheckbox,
	FormCheckboxProps,
	FormFieldScope,
	FormInput,
	FormInputProps,
	FormLabel,
	FormRadioInput,
	FormRadioItemProps,
	useFormFieldState,
} from '@contember/react-form'
import * as React from 'react'
import { ComponentProps, ReactNode } from 'react'
import { useEnumOptionsFormatter } from '../labels'
import { CheckboxInput, Input, RadioInput } from '../ui/input'
import { TextareaAutosize } from '../ui/textarea'
import { cn } from '../utils'
import { FormContainer, FormContainerProps } from './container'
import { FormLabelUI } from './ui'
import { FormFieldLabel } from './labels'

/**
 * Props for the {@link InputField} component.
 */
export type InputFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& { required?: boolean; inputProps?: ComponentProps<typeof Input> }

/**
 * Props {@link InputFieldProps}.
 *
 * `InputField` is a form input component that integrates with {@link FormFieldScope},
 * {@link FormContainer}, and {@link FormInput} to provide a structured and configurable input field.
 *
 * #### Example: Basic usage
 * ```tsx
 * <InputField field="title" label="Article title" />
 * ```
 *
 * #### Example: With additional input properties
 * ```tsx
 * <InputField
 *   field="title"
 *   label="Article title"
 *   inputProps={{ placeholder: 'Enter a title' }}
 * />
 */
export const InputField = Component<InputFieldProps>(({ field, label, description, inputProps, isNonbearing, defaultValue, required, parseValue, formatValue }) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label} required={required}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} parseValue={parseValue} formatValue={formatValue}>
				<Input required={required} {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
			</FormInput>
		</FormContainer>
	</FormFieldScope>
))

/**
 * Props for the {@link TextareaField} component.
 */
export type TextareaFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& { required?: boolean; inputProps?: ComponentProps<typeof TextareaAutosize> }

/**
 * `TextareaField` is a form textarea component that integrates with `FormFieldScope`,
 * `FormContainer`, and `FormInput` to provide a structured and configurable multi-line input field.
 *
 * Must be used within a form context.
 *
 * #### Features
 * - Supports field scoping for form state management
 * - Includes a label and description for accessibility
 * - Handles required validation
 * - Supports automatic resizing with `TextareaAutosize`
 * - Allows custom input properties via `inputProps`
 *
 * #### Example: Basic usage
 * ```tsx
 * <TextareaField
 *   field="bio"
 *   label="Biography"
 *   description="Tell us about yourself"
 *   required
 *   inputProps={{ placeholder: "Write something..." }}
 * />
 * ```
 */
export const TextareaField = Component<TextareaFieldProps>(props => (
	<FormFieldScope field={props.field}>
		<FormContainer description={props.description} label={props.label} required={props.required}>
			<FormInput field={props.field} isNonbearing={props.isNonbearing} defaultValue={props.defaultValue}>
				<TextareaAutosize
					required={props.required}
					{...(props.inputProps ?? {})}
					className={cn('max-w-md', props.inputProps?.className)}
				/>
			</FormInput>
		</FormContainer>
	</FormFieldScope>
))

export type CheckboxFieldProps =
	& Omit<FormCheckboxProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& { required?: boolean; inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'> }

/**
 * CheckboxField is a component for boolean fields. Must be used within an Entity context.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features:
 * - Renders as a standard checkbox input
 * - Label appears adjacent to the checkbox
 * - Required state reflects field nullability (can be overridden)
 *
 * #### Example: Basic usage
 * ```tsx
 * <CheckboxField
 *   field="isPublished"
 *   label="Publish immediately"
 * />
 * ```
 */
export const CheckboxField = Component(({
	field,
	label,
	description,
	inputProps,
	isNonbearing,
	defaultValue,
	required,
}: CheckboxFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={false}>
			<div className="flex gap-2 items-center">
				<FormCheckbox field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
					<CheckboxInput required={required} {...inputProps} />
				</FormCheckbox>
				<FormLabel>
					<FormLabelUI required={required}>{label ?? <FormFieldLabel />}</FormLabelUI>
				</FormLabel>
			</div>
		</FormContainer>
	</FormFieldScope>
))


export type RadioEnumFieldProps =
	& Omit<FormRadioItemProps, 'children' | 'value'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		options?: Record<string, ReactNode> | Array<{ value: null | string | number | boolean; label: React.ReactNode }>
		orientation?: 'horizontal' | 'vertical'
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

/**
 * RadioEnumField is a component for enum fields with radio button selection. Must be used within an Entity context.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * Features:
 * - Can auto-generate options from enum definitions
 * - Supports horizontal or vertical layout
 * - Options can be provided explicitly or derived from enum labels
 *
 * #### Example: Basic usage
 * ```tsx
 * <RadioEnumField
 *   field="status"
 *   label="Article Status"
 *   orientation="horizontal"
 *   options={[
 *     { value: 'draft', label: 'Draft' },
 *     { value: 'published', label: 'Published' }
 *   ]}
 * />
 * ```
 *
 * #### Example: Using enum auto-detection
 * ```tsx
 * // Using enum auto-detection
 * <RadioEnumField
 *   field="category"
 *   label="Article Category"
 * />
 * ```
 */
export const RadioEnumField = Component<RadioEnumFieldProps>(({ field, label, description, required, ...rest }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label} required={required}>
				<RadioEnumFieldInner field={field} required={required} {...rest} />
			</FormContainer>
		</FormFieldScope>
	)
}, ({ field, isNonbearing, defaultValue }) =>
	<Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />)

type RadioEnumFieldInnerProps = Pick<RadioEnumFieldProps, 'field' | 'options' | 'orientation' | 'inputProps' | 'defaultValue' | 'isNonbearing' | 'required'>

const RadioEnumFieldInner = ({
	field,
	inputProps,
	isNonbearing,
	required,
	options,
	orientation,
	defaultValue,
}: RadioEnumFieldInnerProps) => {
	const enumLabelsFormatter = useEnumOptionsFormatter()
	const enumName = useFormFieldState()?.field?.enumName
	options ??= enumName ? enumLabelsFormatter(enumName) : undefined
	if (!options) {
		throw new Error('RadioEnumField: options are required')
	}

	const normalizedOptions = React.useMemo(() => {
		return Array.isArray(options) ? options : Object.entries(options).map(([value, label]) => ({ value, label }))
	}, [options])

	return (
		<div className={'flex flex-wrap gap-3 data-[orientation=vertical]:flex-col'} data-orientation={orientation ?? 'vertical'}>
			{normalizedOptions.map(({ value, label }) => (
				<FormLabelUI className="flex gap-2 items-center font-normal" key={value?.toString()}>
					<FormRadioInput field={field} value={value} defaultValue={defaultValue} isNonbearing={isNonbearing}>
						<RadioInput required={required} {...inputProps} />
					</FormRadioInput>
					{label}
				</FormLabelUI>
			))}
		</div>
	)
}
