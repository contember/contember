import * as React from 'react'
import { ChangeEventHandler, ComponentType, useCallback, useState } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Component, Field, OptionallyVariableFieldValue, SugaredRelativeSingleField, useField } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { useFormInputHandler } from '../internal/useFormInputHandler'
import { useFormFieldState } from '../contexts'
import { useFormInputValidationHandler } from '../hooks/useFormInputValidationHandler'
import { FormInputHandler } from '../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'

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
	const accessor = useField(field)

	const formState = useFormFieldState()
	const id = formState?.htmlId
	const hasErrors = (formState?.errors.length ?? accessor.errors?.errors?.length ?? 0) > 0
	const dirty = formState?.dirty ?? accessor.hasUnpersistedChanges
	const required = formState?.required ?? !accessor.schema.nullable

	const [state, setState] = useState<any>(undefined)

	const { parseValue, formatValue, defaultInputProps } = useFormInputHandler(accessor, { formatValue: formatValueIn, parseValue: parseValueIn })
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)

	return (
		<SlotInput
			ref={ref}
			value={formatValue(accessor.value, { state, setState })}
			data-invalid={dataAttribute(hasErrors)}
			data-dirty={dataAttribute(dirty)}
			data-required={dataAttribute(required)}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={useReferentiallyStableCallback<ChangeEventHandler<HTMLInputElement>>(e => {
				accessorGetter().updateValue(parseValue(e.target.value, { state, setState }))
			})}
			{...defaultInputProps}
			id={id ? `${id}-input` : undefined}
			required={required}
			{...props}
		/>
	)
}, ({ field, isNonbearing, defaultValue }) => {
	return <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />
})
