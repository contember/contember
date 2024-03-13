import { MultiSelectInput, MultiSelectInputProps, SelectInput, SelectInputProps, SortableMultiSelectInput, SortableMultiSelectInputProps } from '../select'
import * as React from 'react'
import { FormContainer, FormContainerProps } from './container'
import { FormHasManyRelationScope, FormHasOneRelationScope } from '@contember/react-form'
import { Component } from '@contember/interface'


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
