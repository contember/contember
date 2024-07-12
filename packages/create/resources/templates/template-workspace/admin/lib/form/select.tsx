import {
	MultiSelectInput,
	MultiSelectInputProps,
	SelectDefaultPlaceholderUI,
	SelectInput,
	SelectInputActionsUI,
	SelectInputProps,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectListItemUI,
	SelectPopoverContent,
	SortableMultiSelectInput,
	SortableMultiSelectInputProps,
} from '../select'
import * as React from 'react'
import { FormContainer, FormContainerProps } from './container'
import { FormFieldScope, FormHasManyRelationScope, FormHasOneRelationScope, useFormFieldId } from '@contember/react-form'
import { Component, Field, SugaredRelativeSingleField, useField } from '@contember/interface'
import { Popover, PopoverTrigger } from '../ui/popover'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'


export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SelectField = Component<SelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting }) => {
	return (
		<FormHasOneRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<SelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm} initialSorting={initialSorting}>
					{children}
				</SelectInput>
			</FormContainer>
		</FormHasOneRelationScope>
	)
})

export type MultiSelectFieldProps =
	& MultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const MultiSelectField = Component<MultiSelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<MultiSelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm} initialSorting={initialSorting}>
					{children}
				</MultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})

export type SortableMultiSelectFieldProps =
	& SortableMultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SortableMultiSelectField = Component<SortableMultiSelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, sortableBy, connectAt, createNewForm, errors, initialSorting }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<SortableMultiSelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} sortableBy={sortableBy} connectAt={connectAt} createNewForm={createNewForm} initialSorting={initialSorting}>
					{children}
				</SortableMultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})

export type SelectEnumFieldProps =
	& Omit<FormContainerProps, 'children'>
	& {
		field: SugaredRelativeSingleField['field']
		options: Record<string, React.ReactNode>
		placeholder?: React.ReactNode
		defaultValue?: string
	}

export const SelectEnumField = Component<SelectEnumFieldProps>(
	({ field, label, description, options, placeholder }) => {
		return (
			<FormFieldScope field={field}>
				<FormContainer description={description} label={label}>
					<SelectEnumFieldInner field={field} options={options} placeholder={placeholder} />
				</FormContainer>
			</FormFieldScope>
		)
	},
	({ field, defaultValue }) => <Field field={field} defaultValue={defaultValue} />,
	'SelectEnumField',
)

const SelectEnumFieldInner = ({ field, options, placeholder }: SelectEnumFieldProps) => {
	const [open, setOpen] = React.useState(false)
	const fieldAccessor = useField<string>(field)
	const id = useFormFieldId()
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<SelectInputWrapperUI>
				<PopoverTrigger asChild>
					<SelectInputUI id={id ? `${id}-input` : undefined}>
						{fieldAccessor.value ? options[fieldAccessor.value] : placeholder ?? <SelectDefaultPlaceholderUI />}
						<SelectInputActionsUI>
							{open ? <ChevronUpIcon /> : <ChevronDownIcon />}
						</SelectInputActionsUI>
					</SelectInputUI>
				</PopoverTrigger>
			</SelectInputWrapperUI>
			<SelectPopoverContent>
				{Object.entries(options).map(([value, label]) => (
					<SelectListItemUI key={value} onClick={() => {
						fieldAccessor.updateValue(value)
						setOpen(false)
					}}>
						{label}
					</SelectListItemUI>
				))}
			</SelectPopoverContent>
		</Popover>

	)
}
