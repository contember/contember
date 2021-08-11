import type { FieldAccessor, FieldValue } from '@contember/binding'
import { useEntityBeforePersist } from '@contember/binding'
import type { ChangeEventHandler, FocusEventHandler } from 'react'
import { useCallback, useRef } from 'react'
import type { SimpleRelativeSingleFieldMetadata } from '../auxiliary'

export type TextInputValueParser<Value extends FieldValue> = (
	value: string,
	field: FieldAccessor<Value>,
) => Value | null
export type TextInputValueFormatter<Value extends FieldValue> = (
	value: Value | null,
	field: FieldAccessor<Value>,
) => string
interface UseTextInputEventsProps<Value extends FieldValue> {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<Value>
	parse: TextInputValueParser<Value>
	format?: TextInputValueFormatter<Value>
	onBlur?: FocusEventHandler
}

export const stringFieldParser: TextInputValueParser<string> = (value, field) =>
	!value && field.valueOnServer === null ? null : value

const defaultFormatter: TextInputValueFormatter<FieldValue> = value => String(value ?? '')

export const useTextInput = <Value extends FieldValue>({
	fieldMetadata,
	parse,
	onBlur,
	format,
}: UseTextInputEventsProps<Value>) => {
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>()
	const field = fieldMetadata.field
	useEntityBeforePersist(
		useCallback(() => {
			if (!inputRef.current) {
				return
			}
			if (!inputRef.current.validity.valid) {
				field.addError(inputRef.current.validationMessage)
			}
		}, [field]),
	)
	return {
		value: (format || defaultFormatter)(field.value, field),
		validationState: field.errors ? ('invalid' as const) : undefined,
		ref: inputRef,
		readOnly: fieldMetadata.isMutating,
		onChange: useCallback<ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>>(
			e => {
				field.updateValue(parse(e.target.value, field))
			},
			[field, parse],
		),
		onBlur: useCallback<FocusEventHandler<HTMLInputElement & HTMLTextAreaElement>>(
			e => {
				onBlur?.(e)
				if (e.isDefaultPrevented()) {
					return
				}
				field.clearErrors()
				if (!e.target.validity.valid) {
					field.addError(e.target.validationMessage)
				}
			},
			[field, onBlur],
		),
	}
}
