import { Component, Field, OptionallyVariableFieldValue, SugaredRelativeSingleField, useField } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { ChangeEventHandler, useCallback } from 'react'
import { useFormError, useFormFieldId } from '../contexts'
import { useFormInputValidationHandler } from '../hooks'

const SlotInput = Slot as React.ForwardRefExoticComponent<React.RefAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>>

export interface FormRadioItemProps {
	field: SugaredRelativeSingleField['field']
	value: string | null | number | boolean
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	children: React.ReactNode
}

export const FormRadioInput = Component<FormRadioItemProps>(({ field, value, defaultValue, isNonbearing, ...props }) => {
	const id = useFormFieldId()
	const accessor = useField(field)
	const errors = useFormError() ?? accessor.errors?.errors ?? []
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)

	const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
		accessorGetter().updateValue(value)
	}, [accessorGetter, value])

	return (
		<SlotInput
			ref={ref}
			type="radio"
			value={typeof value === 'string' ? value : undefined}
			checked={accessor.value === value}
			data-invalid={dataAttribute(errors.length > 0)}
			name={id + '-input'}
			id={`${id}-input-${value}`}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={handleChange}
			{...props}
		/>
	)
}, ({ field, isNonbearing, defaultValue }) => {
	return <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}/>
})
