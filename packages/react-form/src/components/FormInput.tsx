import * as React from 'react'
import { ChangeEventHandler, ComponentType, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Component, Field, OptionallyVariableFieldValue, SugaredRelativeSingleField, useField } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { useFormInputHandler } from '../internal/useFormInputHandler'
import { useFormError, useFormFieldId } from '../contexts'
import { useFormInputValidationHandler } from '../hooks/useFormInputValidationHandler'
import { FormInputHandler } from '../types'

type InputProps = React.JSX.IntrinsicElements['input']
const SlotInput = Slot as ComponentType<InputProps>

export interface FormInputProps {
	field: SugaredRelativeSingleField['field']
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	children: React.ReactElement
	formatValue?: FormInputHandler['formatValue']
	parseValue?: FormInputHandler['parseValue']
}

export const FormInput = Component<FormInputProps>(({ field, isNonbearing, defaultValue, formatValue: formatValueIn, parseValue: parseValueIn, ...props }) => {
	const id = useFormFieldId()
	const accessor = useField(field)
	const errors = useFormError() ?? accessor.errors?.errors ?? []
	const { parseValue, formatValue, defaultInputProps } = useFormInputHandler(accessor, { formatValue: formatValueIn, parseValue: parseValueIn })
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)

	return (
		<SlotInput
			ref={ref}
			value={formatValue(accessor.value)}
			data-invalid={dataAttribute(errors.length > 0)}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
				accessorGetter().updateValue(parseValue(e.target.value))
			}, [accessorGetter, parseValue])}
			{...defaultInputProps}
			id={id ? `${id}-input` : undefined}
			required={!accessor.schema.nullable}
			{...props}
		/>
	)
}, ({ field, isNonbearing, defaultValue }) => {
	return <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />
})
