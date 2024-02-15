import * as React from 'react'
import { ComponentProps, forwardRef, ReactNode } from 'react'
import { Label } from './ui/label'
import { Component, Field, SugaredRelativeSingleField } from '@contember/interface'
import { Input } from './ui/input'
import { uic } from '../utils/uic'
import { useErrorFormatter } from './errors'
import { cn } from '../utils/cn'
import { MultiSelectInput, MultiSelectInputProps, SelectInput, SelectInputProps, SortableMultiSelectInput, SortableMultiSelectInputProps } from './select'
import { FormCheckbox, FormCheckboxProps, FormError, FormFieldScope, FormHasManyRelationScope, FormHasOneRelationScope, FormInput, FormInputProps, FormLabel, FormRadioInput } from '@contember/react-form'

const FormDescriptionUI = uic('p', {
	baseClass: 'text-[0.8rem] text-muted-foreground',
	displayName: 'FormDescription',
})

const FormErrorUI = uic('p', {
	baseClass: 'text-[0.8rem] font-medium text-destructive',
	displayName: 'FormError',
})
const FormLabelWrapperUI = uic('div', {
	baseClass: 'flex md:justify-end md:items-center',
	displayName: 'FormLabelWrapper',
})
const FormLabelUI = uic(Label, {
	baseClass: 'data-[invalid]:text-destructive',
	displayName: 'FormLabel',
})
const FormContainerUI = uic('div', {
	baseClass: 'grid grid-cols-1 md:grid-cols-[12rem,1fr] gap-x-4 gap-y-2',
	displayName: 'FormContainer',
})

interface FormContainerProps {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
}

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
		<div></div>
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
	inputProps?: ComponentProps<typeof Input>
}

export const InputField = Component(({ field, label, description, inputProps, isNonbearing, defaultValue }: InputFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label}>
			<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
				<Input {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
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
					<CheckboxInputUI {...inputProps} />
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


const CheckboxInputUI = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>((props, ref) => {
	return <input ref={ref} type="checkbox" {...props} className="
		appearance-none bg-white w-4 h-4 ring-1 ring-gray-400 hover:ring-gray-600 grid place-items-center
		before:transform  before:transition-all before:scale-0 checked:before:scale-100
		checked:before:bg-gray-600 checked:before:w-2 checked:before:h-2 checked:before:content-['']
		before:leading-3 before:text-sm data-[state=indeterminate]:before:content-['?'] data-[state=indeterminate]:before:scale-100
	" />
})


export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SelectField = Component<SelectFieldProps>(({ field, label, description, children, options, filterField, placeholder }) => {
	return (
		<FormHasOneRelationScope field={field}>
			<FormContainer description={description} label={label}>
				<SelectInput field={field} filterField={filterField} options={options} placeholder={placeholder}>
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
				<div className={'flex flex-wrap gap-3 data-[orientation=vertical]:flex-col'} data-orientation={orientation ?? 'vertical'}>
					{Object.entries(options).map(([value, label]) => (
						<FormLabelUI className="flex gap-2 items-center font-normal" key={value}>
							<FormRadioInput field={field} value={value}>
								<RadioInputUI {...inputProps} />
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

const RadioInputUI = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>((props, ref) => {
	return <input ref={ref} type="radio" {...props} className="
		appearance-none bg-white rounded-full w-4 h-4 ring-1 ring-gray-400 hover:ring-gray-600 grid place-items-center
		before:rounded-full before:bg-gray-600 before:w-2 before:h-2 before:ring-2 before:ring-white before:content-[''] before:transform  before:transition-all before:scale-0 checked:before:scale-100
	"/>
})
