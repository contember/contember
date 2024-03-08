import * as React from 'react'
import { ComponentProps, ReactNode } from 'react'
import { Label } from './ui/label'
import { Component, Field, SugaredRelativeSingleField } from '@contember/interface'
import { CheckboxInput, Input, RadioInput } from './ui/input'
import { uic } from '../../lib/utils/uic'
import { useErrorFormatter } from './errors'
import { cn } from '../../lib/utils/cn'
import { MultiSelectInput, MultiSelectInputProps, SelectInput, SelectInputProps, SortableMultiSelectInput, SortableMultiSelectInputProps } from './select'
import { FormCheckbox, FormCheckboxProps, FormError, FormFieldScope, FormHasManyRelationScope, FormHasOneRelationScope, FormInput, FormInputProps, FormLabel, FormRadioInput } from '@contember/react-form'
import { TextareaAutosize } from './ui/textarea'

export const FormLayout = uic('div', {
	baseClass: 'flex flex-col gap-2 w-full ml-4',
	displayName: 'FormLayout',
})

const FormDescriptionUI = uic('p', {
	baseClass: 'text-[0.8rem] text-muted-foreground',
	displayName: 'FormDescription',
})

const FormErrorUI = uic('p', {
	baseClass: 'text-[0.8rem] font-medium text-destructive',
	displayName: 'FormError',
})
const FormLabelWrapperUI = uic('div', {
	baseClass: 'flex',
	displayName: 'FormLabelWrapper',
})
const FormLabelUI = uic(Label, {
	baseClass: 'data-[invalid]:text-destructive text-right',
	displayName: 'FormLabel',
})
const FormContainerUI = uic('div', {
	baseClass: 'flex flex-col gap-2 w-full',
	displayName: 'FormContainer',
})

interface FormContainerProps {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
	errors?: ReactNode
}


export const FieldContainer = ({ children, description, label, errors }: FormContainerProps) => (
	<FormContainerUI>
		<FormLabelWrapperUI>
			{label &&
				<FormLabelUI>
					{label}
				</FormLabelUI>
			}
		</FormLabelWrapperUI>
		<div>
			{children}
		</div>
		<div></div>
		<div>
			{description && <FormDescriptionUI>
				{description}
			</FormDescriptionUI>}

			{errors}
		</div>
	</FormContainerUI>
)

const FormContainer = Component(({ children, description, label }: FormContainerProps) => (
	<FormContainerUI>
		<FormLabelWrapperUI>
			{label && <FormLabel>
				<FormLabelUI>
					{label}
				</FormLabelUI>
			</FormLabel>}
		</FormLabelWrapperUI>
		<div>
			{children}
		</div>
		<div>
			{description && <FormDescriptionUI>
				{description}
			</FormDescriptionUI>}

			<FormError formatter={useErrorFormatter()}>
				<FormErrorUI />
			</FormError>
		</div>
	</FormContainerUI>
), ({ children, label, description }) => <>
	{label}
	{children}
	{description}
</>)

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




export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SelectField = Component<SelectFieldProps>(({ field, label, description, children, options, filterField, placeholder, createNewForm }) => {
	return (
		<FormHasOneRelationScope field={field}>
			<FormContainer description={description} label={label}>
				<SelectInput field={field} filterField={filterField} options={options} placeholder={placeholder} createNewForm={createNewForm}>
					{children}
				</SelectInput>
			</FormContainer>
		</FormHasOneRelationScope>
	)
})

export type MultiSelectFieldProps =
	& MultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const MultiSelectField = Component<MultiSelectFieldProps>(({ field, label, description, children, options, filterField, placeholder }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label}>
				<MultiSelectInput field={field} filterField={filterField} options={options} placeholder={placeholder}>
					{children}
				</MultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})

export type SortableMultiSelectFieldProps =
	& SortableMultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SortableMultiSelectField = Component<SortableMultiSelectFieldProps>(({ field, label, description, children, options, filterField, placeholder, sortableBy, connectAt }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label}>
				<SortableMultiSelectInput field={field} filterField={filterField} options={options} placeholder={placeholder} sortableBy={sortableBy} connectAt={connectAt}>
					{children}
				</SortableMultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})


export type RadioEnumFieldProps =
	& Omit<FormContainerProps, 'children'>
	& {
		field: SugaredRelativeSingleField['field']
		options: Record<string, ReactNode>
		orientation?: 'horizontal' | 'vertical'
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

export const RadioEnumField = Component<RadioEnumFieldProps>(({ field, label, description, options, inputProps, orientation }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label}>
				<div className={'flex flex-wrap gap-3 data-[orientation=vertical]:flex-col'} data-orientation={orientation ?? 'horizontal'}>
					{Object.entries(options).map(([value, label]) => (
						<FormLabelUI className="flex gap-2 items-center font-normal" key={value}>
							<FormRadioInput field={field} value={value}>
								<RadioInput {...inputProps} />
							</FormRadioInput>
							{label}
						</FormLabelUI>
					))}
				</div>
			</FormContainer>
		</FormFieldScope>
	)
}, ({ field }) => {
	return <Field field={field} />
})
