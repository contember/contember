import { MultiSelectInput, MultiSelectInputProps, SelectInput, SelectInputProps, SortableMultiSelectInput, SortableMultiSelectInputProps } from '../select'
import * as React from 'react'
import { FormContainer, FormContainerProps } from './container'
import { FormHasManyRelationScope, FormHasOneRelationScope } from '@contember/react-form'
import { Component } from '@contember/interface'


export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SelectField = Component<SelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors }) => {
	return (
		<FormHasOneRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<SelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm}>
					{children}
				</SelectInput>
			</FormContainer>
		</FormHasOneRelationScope>
	)
})

export type MultiSelectFieldProps =
	& MultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const MultiSelectField = Component<MultiSelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, createNewForm, errors }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<MultiSelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} createNewForm={createNewForm}>
					{children}
				</MultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})

export type SortableMultiSelectFieldProps =
	& SortableMultiSelectInputProps
	& Omit<FormContainerProps, 'children'>

export const SortableMultiSelectField = Component<SortableMultiSelectFieldProps>(({ field, label, description, children, options, queryField, placeholder, sortableBy, connectAt, createNewForm, errors }) => {
	return (
		<FormHasManyRelationScope field={field}>
			<FormContainer description={description} label={label} errors={errors}>
				<SortableMultiSelectInput field={field} queryField={queryField} options={options} placeholder={placeholder} sortableBy={sortableBy} connectAt={connectAt} createNewForm={createNewForm}>
					{children}
				</SortableMultiSelectInput>
			</FormContainer>
		</FormHasManyRelationScope>
	)
})
