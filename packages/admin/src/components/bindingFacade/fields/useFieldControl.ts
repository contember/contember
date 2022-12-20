import type { FieldAccessor, FieldValue } from '@contember/binding'
import { useEntityBeforePersist } from '@contember/binding'
import type { AllControlProps, ControlProps } from '@contember/ui'
import { Ref, useCallback, useEffect, useRef, useState } from 'react'
import type { SimpleRelativeSingleFieldMetadata } from '../auxiliary'

export type ControlValueParser<ControlVal, FieldVal extends FieldValue> = (
	value: ControlVal | null | undefined,
	field: FieldAccessor<FieldVal>,
) => FieldVal | null

export type FieldValueFormatter<FieldVal extends FieldValue, ControlVal extends FieldValue> = (
	value: FieldVal | null | undefined,
	field: FieldAccessor<FieldVal>,
) => ControlVal | null

export type UseControlProps<
	FieldVal extends FieldValue,
	ControlVal extends FieldValue,
> = ControlProps<FieldVal> & {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<FieldVal>
	parse: ControlValueParser<ControlVal, FieldVal>
	format: FieldValueFormatter<FieldVal, ControlVal>
}

export const useFieldControl = <FieldVal extends FieldValue, ControlVal extends FieldValue, Type extends string | undefined = string | undefined>({
	fieldMetadata,
	parse,
	format,
	...props
}: UseControlProps<FieldVal, ControlVal>): AllControlProps<ControlVal> & {
	ref: Ref<any>,
} => {
	// TODO: fix unknow
	const ref = useRef()

	// `fieldMetadata.field` is mutable and would otherwise cause render loop
	const field = useRef(fieldMetadata.field)
	field.current = fieldMetadata.field

	const [validationError, setValidationError] = useState<string>()
	const [wasTouched, setWasTouched] = useState<boolean>()

	useEntityBeforePersist(
		useCallback(() => {
			if (validationError) {
				field.current.addError(validationError)
			}
		}, [field, validationError]),
	)

	useEffect(() => {
		if (wasTouched) {
			field.current.clearErrors()

			if (validationError) {
				field.current.addError(validationError)
			}
		}
	}, [validationError, wasTouched])

	return {
		ref,

		...props,

		// ControlValueProps
		defaultValue: format(field.current.defaultValue, field.current) ?? undefined,
		onChange: useCallback((_value?: ControlVal | null) => {
			const value = parse(_value, field.current) ?? null
			const valueOrNull = value || value === 0 || value === false ? value : null

			const isEmptyOnServer = field.current.valueOnServer === null
			const isStillEmpty = valueOrNull === null

			field.current.updateValue(isEmptyOnServer && isStillEmpty ? null : value)
		}, [parse]),
		placeholder: props.placeholder,
		name: props.name,
		value: format(field.current.value, field.current),

		// ControlConstraintProps
		max: format(props.max, field.current),
		maxLength: props.maxLength,
		min: format(props.min, field.current),
		minLength: props.minLength,
		pattern: props.pattern,

		// ValidationStateProps
		validationState: field.current.errors ? ('invalid' as const) : undefined,
		onValidationStateChange: useCallback((error?: string) => {
			if (field.current.isTouched) {
				setWasTouched(true)
			}

			setValidationError(error)
		}, [field]),

		// ControlStateProps
		active: props.active,
		readOnly: props.readOnly || fieldMetadata.isMutating,
		disabled: props.disabled || fieldMetadata.isMutating,
		loading: fieldMetadata.isMutating,
		required: props.required, // TODO: ?? fieldMetadata.field.schema.required,
		notNull: props.notNull ?? fieldMetadata.field.schema.nullable === false,
		focused: props.focused,
		hovered: props.hovered,

		// ControlFocusProps
		onBlur: useCallback(() => {
			setWasTouched(true)
		}, [setWasTouched]),
		onFocus: useCallback(() => {}, []),
		onFocusChange: useCallback(() => {}, []),

		// ControlDisplayProps
		id: props.id,
		className: props.className,
		distinction: props.distinction,
		intent: props.intent,
		scheme: props.scheme,
		size: props.size,
	}
}
