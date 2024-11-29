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
import { useCallback, useMemo } from 'react'
import { FormContainer, FormContainerProps } from './container'
import { FormFieldScope, FormHasManyRelationScope, FormHasOneRelationScope, useFormFieldId, useFormFieldState } from '@contember/react-form'
import { Component, Field, RecursionTerminator, SugaredRelativeSingleField, useEntityBeforePersist, useField } from '@contember/interface'
import { Popover, PopoverTrigger } from '../ui/popover'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { dict } from '../dict'
import { useEnumOptionsFormatter } from '../labels'

export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SelectField = Component<SelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting, required }, env) => {
	return (
		<RecursionTerminator field={{ field, kind: 'hasOne' }}>
			<FormHasOneRelationScope field={field}>
				<FormContainer description={description} label={label} errors={errors} required={required}>
					<SelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm} initialSorting={initialSorting} required={required}>
						{children}
					</SelectInput>
				</FormContainer>
			</FormHasOneRelationScope>
		</RecursionTerminator>
	)
})

export type MultiSelectFieldProps =
	& MultiSelectInputProps
	& Omit<FormContainerProps, 'children' | 'required'>

export const MultiSelectField = Component<MultiSelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting }) => {
	return (
		<RecursionTerminator field={{ field, kind: 'hasMany' }}>
			<FormHasManyRelationScope field={field}>
				<FormContainer description={description} label={label} errors={errors}>
					<MultiSelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm} initialSorting={initialSorting}>
						{children}
					</MultiSelectInput>
				</FormContainer>
			</FormHasManyRelationScope>
		</RecursionTerminator>
	)
})

export type SortableMultiSelectFieldProps =
	& SortableMultiSelectInputProps
	& Omit<FormContainerProps, 'children' | 'required'>

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
		options?: Record<string, React.ReactNode> | { value: null | string | number | boolean; label: React.ReactNode }[]
		placeholder?: React.ReactNode
		defaultValue?: string
		required?: boolean
	}

export const SelectEnumField = Component<SelectEnumFieldProps>(
	({ field, label, description, options, placeholder, required }) => {
		return (
			<FormFieldScope field={field}>
				<FormContainer description={description} label={label} required={required}>
					<SelectEnumFieldInner field={field} options={options} placeholder={placeholder} required={required} />
				</FormContainer>
			</FormFieldScope>
		)
	},
	({ field, defaultValue }) => <Field field={field} defaultValue={defaultValue} />,
	'SelectEnumField',
)

const SelectEnumFieldInner = ({ field, options, placeholder, required }: SelectEnumFieldProps) => {
	const [open, setOpen] = React.useState(false)
	const fieldAccessor = useField(field)
	const fieldAccessorGetter = fieldAccessor.getAccessor
	useEntityBeforePersist(useCallback(() => {
		if (!required) {
			return
		}
		const field = fieldAccessorGetter()
		if (!field.value) {
			field.addError(dict.errors.required)
		}
	}, [fieldAccessorGetter, required]))
	const id = useFormFieldId()
	const enumLabelsFormatter = useEnumOptionsFormatter()
	const enumName = useFormFieldState()?.field?.enumName
	options ??= enumName ? enumLabelsFormatter(enumName) : undefined
	if (!options) {
		throw new Error('SelectEnumFields: options are required')
	}
	const normalizedOptions = useMemo(() => {
		return Array.isArray(options) ? options : Object.entries(options).map(([value, label]) => ({ value, label }))
	}, [options])
	const selectedValue = useMemo(() => {
		return normalizedOptions.find(it => it.value === fieldAccessor.value)
	}, [fieldAccessor.value, normalizedOptions])


	return (
		<Popover open={open} onOpenChange={setOpen}>
			<SelectInputWrapperUI>
				<PopoverTrigger asChild>
					<SelectInputUI id={id ? `${id}-input` : undefined}>
						{selectedValue?.label ?? placeholder ?? <SelectDefaultPlaceholderUI />}
						<SelectInputActionsUI>
							{open ? <ChevronUpIcon className={'w-4 h-4'} /> : <ChevronDownIcon className={'w-4 h-4'} />}
						</SelectInputActionsUI>
					</SelectInputUI>
				</PopoverTrigger>
			</SelectInputWrapperUI>
			<SelectPopoverContent>
				{normalizedOptions.map(({ value, label }) => (
					<SelectListItemUI key={value?.toString()} onClick={() => {
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
