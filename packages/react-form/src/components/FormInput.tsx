import * as React from 'react'
import { ChangeEventHandler, ComponentType, useCallback, useMemo } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { FieldAccessor, OptionallyVariableFieldValue, SchemaColumn, SugaredRelativeSingleField } from '@contember/binding'
import { Component, SchemaKnownColumnType, useField } from '@contember/interface'
import { dataAttribute } from '@contember/utilities'
import { Field } from '@contember/react-binding'
import { useFormInputHandler } from '../internal/useFormInputHandler'
import { useFormError } from '../contexts'
import { useFormFieldId } from '../contexts'
import { useFormInputValidationHandler } from '../hooks/useFormInputValidationHandler'

type InputProps = React.JSX.IntrinsicElements['input']
const SlotInput = Slot as ComponentType<InputProps>

export interface FormInputProps {
	field: SugaredRelativeSingleField['field']
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	children: React.ReactElement
}

export const FormInput = Component<FormInputProps>(({ field, isNonbearing, defaultValue, ...props }) => {
	const id = useFormFieldId()
	const accessor = useField(field)
	const errors = useFormError() ?? accessor.errors?.errors ?? []
	const { parseValue, formatValue, defaultInputProps } = useFormInputHandler(accessor)
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
