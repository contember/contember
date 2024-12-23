import { FormContainer, FormContainerProps } from '~/lib/form'
import { ComponentProps, useState } from 'react'
import { Input } from '~/lib/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/lib/ui/select'
import { cn } from '~/lib/utils'
import * as React from 'react'
import { FormFieldScope, FormInput, FormInputProps } from '@contember/react-form'
import { Component, Field } from '@contember/react-binding'
import { useField } from '@contember/react-binding'
import { dict } from '~/lib/dict'

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
				{showSelect ? <Select value={fieldValue ?? undefined} onValueChange={value => {
					if (value === '___other') {
						setShowSelect(false)
						fieldAccessor.updateValue('')
					} else {
						fieldAccessor.updateValue(value)

					}
				}} {...selectProps}>
					<SelectTrigger className={cn('max-w-md')}>
						<SelectValue placeholder={dict.select.placeholder}>{fieldValue}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{Object.entries(options ?? {}).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
						<SelectItem value="___other">Other</SelectItem>
					</SelectContent>
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
