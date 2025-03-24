import { ComponentProps, ReactNode, useMemo } from 'react'
import { CheckboxInput, Input, RadioInput } from '../ui/input'
import { TextareaAutosize } from '../ui/textarea'
import { FormLabelUI } from './ui'
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
import { FormContainer, FormContainerProps } from './container'
import { Component, Field } from '@contember/interface'
import { useEnumOptionsFormatter } from '../labels'
import { FormFieldLabel } from './labels'


export type InputFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof Input>
	}

export const InputField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue, required, parseValue, formatValue }: InputFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label} required={required}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} parseValue={parseValue} formatValue={formatValue}>
				<Input required={required} {...(inputProps ?? {})} />
			</FormInput>
		</FormContainer>
	</FormFieldScope>
))

export type TextareaFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof TextareaAutosize>
	}

export const TextareaField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue, required }: TextareaFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label} required={required}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
				<TextareaAutosize required={required} {...(inputProps ?? {})} />
			</FormInput>
		</FormContainer>
	</FormFieldScope>
))


export type CheckboxFieldProps =
	& Omit<FormCheckboxProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

export const CheckboxField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue, required }: CheckboxFieldProps) => (
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

export const RadioEnumField = Component<RadioEnumFieldProps>(({ field, label, description, required, ...rest }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label} required={required}>
				<RadioEnumFieldInner field={field} required={required} {...rest} />
			</FormContainer>
		</FormFieldScope>
	)
}, ({ field, isNonbearing, defaultValue }) => <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />)

type RadioEnumFieldInnerProps = Pick<RadioEnumFieldProps, 'field' | 'options' | 'orientation' | 'inputProps' | 'defaultValue' | 'isNonbearing' | 'required'>

const RadioEnumFieldInner: React.FC<RadioEnumFieldInnerProps> = ({ field, inputProps, isNonbearing, required, options, orientation, defaultValue }) => {
	const enumLabelsFormatter = useEnumOptionsFormatter()
	const enumName = useFormFieldState()?.field?.enumName
	options ??= enumName ? enumLabelsFormatter(enumName) : undefined
	if (!options) {
		throw new Error('RadioEnumField: options are required')
	}

	const normalizedOptions = useMemo(() => {
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
