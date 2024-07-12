import { FormContainer, FormContainerProps } from '@app/lib/form'
import { ComponentProps, useState } from 'react'
import { Input, Select } from '@app/lib/ui/input'
import { cn } from '@app/lib/utils'
import * as React from 'react'
import { FormFieldScope, FormInput, FormInputProps } from '@contember/react-form'
import { Component, Field } from '@contember/react-binding'
import { useField } from '@contember/react-binding'

export type SelectOrTypeFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		selectProps?: ComponentProps<typeof Select>
		inputProps?: ComponentProps<typeof Input>
		options: Record<string, string>
	}

export const SelectOrTypeField = Component(({ field, label, description, selectProps, inputProps, isNonbearing, defaultValue, required, options }: SelectOrTypeFieldProps) => {
	const fieldAccessor = useField<string>({ field })
	const fieldValue = fieldAccessor.value
	const [showSelect, setShowSelect] = useState(!fieldValue || Object.keys(options).includes(fieldValue))
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label}>
				{showSelect ? <Select onChange={e => {
					const value = e.target.value
					if (value === '___other') {
						setShowSelect(false)
						fieldAccessor.updateValue('')
					} else {
						fieldAccessor.updateValue(value)

					}
				}} {...selectProps} className={cn('max-w-md', selectProps?.className)}>
					<option value="">Select</option>
					{Object.entries(options ?? {}).map(([value, label]) => (
						<option key={value} value={value} selected={value === fieldValue}>
							{label}
						</option>
					))}
					<option value="___other">Other</option>
				</Select>
					: <FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}>
						<Input required={required} {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} />
					</FormInput>}
			</FormContainer>
		</FormFieldScope>
	)
}, ({ field, label, description, isNonbearing, defaultValue }) => {
	return (
		<>
			{label}
			{description}
			<Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />
		</>
	)
})
