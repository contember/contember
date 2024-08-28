import { FormContainer, FormContainerProps } from '@app/lib/form'
import { ComponentProps, useCallback, useEffect, useRef } from 'react'
import { Input } from '@app/lib/ui/input'
import { cn } from '@app/lib/utils'
import * as React from 'react'
import { FormFieldScope, FormInput, FormInputProps } from '@contember/react-form'
import { Component, useField } from '@contember/interface'

export type FractionalAmountFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof Input>
		fractionDigits: number
	}

export const FractionalAmountField = Component(({ field, label, description, required, ...props }: FractionalAmountFieldProps) => (
	<FormFieldScope field={field}>
		<FormContainer description={description} label={label} required={required}>
			<FractionalAmountInput required={required} field={field} {...props} />
		</FormContainer>
	</FormFieldScope>
))


const FractionalAmountInput = Component<FractionalAmountFieldProps>(({
	field,
	inputProps,
	isNonbearing,
	defaultValue,
	required,
	fractionDigits,
}) => {
	const selection = useRef(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const fieldAccessor = useField(field)

	useEffect(() => {
		inputRef.current?.setSelectionRange(selection.current, selection.current)
	}, [fieldAccessor.value])

	const parseValue = useCallback((it: string) => {
		selection.current = inputRef.current?.selectionStart || 0
		const value = parseFloat(it)
		return isNaN(value) ? null : Math.round(value * 10 ** fractionDigits)
	}, [fractionDigits])

	const formatValue = useCallback((it: null | number) => {
		if (it === null) {
			return ''
		}
		if (typeof it !== 'number') {
			throw new Error('Invalid value. Expected number, got ' + typeof it)
		}
		return (it / 10 ** fractionDigits).toFixed(fractionDigits)
	}, [fractionDigits])

	return (
		<FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} parseValue={parseValue} formatValue={formatValue}>
			<Input type="text" required={required} {...(inputProps ?? {})} className={cn('max-w-md', inputProps?.className)} ref={inputRef} />
		</FormInput>
	)
}, ({ field, isNonbearing, defaultValue }) => {
	return <FormInput field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}><input /></FormInput>
})
