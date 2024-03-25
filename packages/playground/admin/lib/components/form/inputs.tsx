import * as React from 'react'
import { ComponentProps, ReactNode } from 'react'
import { CheckboxInput, Input, RadioInput } from '../ui/input'
import { cn } from '../../utils/cn'
import { TextareaAutosize } from '../ui/textarea'
import { FormLabelUI } from './ui'
import { FormCheckbox, FormCheckboxProps, FormFieldScope, FormInput, FormInputProps, FormLabel, FormRadioInput, FormRadioItemProps } from '@contember/react-form'
import { FormContainer, FormContainerProps } from './container'
import { Component, Field, SugaredRelativeSingleField } from '@contember/interface'


export type InputFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof Input>
	}

export const InputField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue, required }: InputFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label}>
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
	inputProps?: ComponentProps<typeof TextareaAutosize>
}

export const TextareaField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue }: TextareaFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
				<TextareaAutosize {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
			</FormInput>
		</FormContainer>
	</FormFieldScope>
))


export type CheckboxFieldProps =
	& Omit<FormCheckboxProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

export const CheckboxField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue }: CheckboxFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={undefined}>
			<div className="flex gap-2 items-center">
				<FormCheckbox field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
					<CheckboxInput {...inputProps} />
				</FormCheckbox>
				{label && <FormLabel>
					<FormLabelUI>
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
		options: Record<string, ReactNode>
		orientation?: 'horizontal' | 'vertical'
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

export const RadioEnumField = Component<RadioEnumFieldProps>(({ field, label, description, options, inputProps, orientation, defaultValue, isNonbearing  }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label}>
				<div className={'flex flex-wrap gap-3 data-[orientation=vertical]:flex-col'} data-orientation={orientation ?? 'vertical'}>
					{Object.entries(options).map(([value, label]) => (
						<FormLabelUI className="flex gap-2 items-center font-normal" key={value}>
							<FormRadioInput field={field} value={value} defaultValue={defaultValue} isNonbearing={isNonbearing}>
								<RadioInput {...inputProps} />
							</FormRadioInput>
							{label}
						</FormLabelUI>
					))}
				</div>
			</FormContainer>
		</FormFieldScope>
	)
})
