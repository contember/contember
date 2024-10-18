import * as React from 'react'
import { ComponentProps, ReactNode } from 'react'
import { CheckboxInput, Input, RadioInput } from '../ui/input'
import { cn } from '../utils'
import { TextareaAutosize } from '../ui/textarea'
import { FormLabelUI } from './ui'
import { FormCheckbox, FormCheckboxProps, FormFieldScope, FormInput, FormInputProps, FormLabel, FormRadioInput, FormRadioItemProps } from '@contember/react-form'
import { FormContainer, FormContainerProps } from './container'
import { Component, Field } from '@contember/interface'


export type InputFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof Input>
	}

export const InputField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue, required }: InputFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label} required={required}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
				<Input required={required} {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
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
				<TextareaAutosize required={required} {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
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
		<FormContainer description={description} label={undefined}>
			<div className="flex gap-2 items-center">
				<FormCheckbox field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
					<CheckboxInput required={required} {...inputProps} />
				</FormCheckbox>
				{label && <FormLabel>
					<FormLabelUI required={required}>
						{label}
					</FormLabelUI>
				</FormLabel>}
			</div>
		</FormContainer>
	</FormFieldScope>
))


export type RadioEnumFieldProps =
	& Omit<FormRadioItemProps, 'children' | 'value'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		options: Record<string, ReactNode> | Array<{ value: null | string | number | boolean; label: React.ReactNode }>
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
}, ({ field }) => <Field field={field} />)

type RadioEnumFieldInnerProps = Pick<RadioEnumFieldProps, 'field' | 'options' | 'orientation' | 'inputProps' | 'defaultValue' | 'isNonbearing' | 'required'>

const RadioEnumFieldInner: React.FC<RadioEnumFieldInnerProps> = ({ field, inputProps, isNonbearing, required, options, orientation, defaultValue }) => {
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
