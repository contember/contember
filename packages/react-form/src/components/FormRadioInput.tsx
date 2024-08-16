import { Component, Field, OptionallyVariableFieldValue, SugaredRelativeSingleField, useField } from '@contember/react-binding'
import * as React from 'react'
import { ChangeEventHandler, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useFormError, useFormFieldId } from '../contexts'
import { useFormInputValidationHandler } from '../hooks'
import { dataAttribute } from '@contember/utilities'

const SlotInput = Slot as React.ForwardRefExoticComponent<React.RefAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>>

export interface FormRadioItemProps {
	field: SugaredRelativeSingleField['field']
	value: string
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	children: React.ReactNode
}

export const FormRadioInput = Component<FormRadioItemProps>(({ field, value, defaultValue, isNonbearing, ...props }) => {
	const id = useFormFieldId()
	const accessor = useField<string>(field)
	const errors = useFormError() ?? accessor.errors?.errors ?? []
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)

	return (
		<SlotInput
			ref={ref}
			type="radio"
			value={value}
			checked={accessor.value === value}
			data-invalid={dataAttribute(errors.length > 0)}
			name={id + '-input'}
			id={`${id}-input-${value}`}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
				accessorGetter().updateValue(value)
			}, [accessorGetter, value])}
			{...props}
		/>
	)
}, ({ field, isNonbearing, defaultValue }) => {
	return <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />
})
