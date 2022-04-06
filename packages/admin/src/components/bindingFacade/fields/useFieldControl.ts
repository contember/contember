import type { FieldAccessor, Scalar } from '@contember/binding'
import { useEntityBeforePersist } from '@contember/binding'
import type { AllControlProps, ControlProps } from '@contember/ui'
import { Ref, useCallback, useEffect, useRef, useState } from 'react'
import type { SimpleRelativeSingleFieldMetadata } from '../auxiliary'

export type ControlValueParser<ControlValue, Value extends Scalar> = (
	value: ControlValue | null | undefined,
	field: FieldAccessor<Value>,
) => Value | null

export type FieldValueFormatter<FieldValue extends Scalar, ControlValue extends Scalar> = (
	value: FieldValue | null | undefined,
	field: FieldAccessor<FieldValue>,
) => ControlValue | null

type UseControlProps<
	FieldValue extends Scalar,
	ControlValue extends Scalar,
> = ControlProps<FieldValue> & {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<FieldValue>
	parse: ControlValueParser<ControlValue, FieldValue>
	format: FieldValueFormatter<FieldValue, ControlValue>
}

export const useFieldControl = <FieldValue extends Scalar, ControlValue extends Scalar, Type extends string | undefined = string | undefined>({
	fieldMetadata,
	parse,
	format,
	...props
}: UseControlProps<FieldValue, ControlValue>): AllControlProps<ControlValue> & {
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
		onChange: useCallback((_value?: ControlValue | null) => {
			const value = parse(_value, field.current) ?? null
			const valueOrNull = value || value === 0 || value === false ? value : null

			const isEmptyOnServer = field.current.valueOnServer === null
			const isStillEmpty = valueOrNull === null

			field.current.updateValue(isEmptyOnServer && isStillEmpty ? null : value)
		}, [parse]),
		placeholder: props.placeholder,
		name: props.name,
		max: format(props.max, field.current),
		min: format(props.min, field.current),
		value: format(field.current.value, field.current),

		// ValidationSteteProps
		validationState: field.current.errors ? ('invalid' as const) : undefined,
		onValidationStateChange: useCallback((error?: string) => {
			if (field.current.isTouched) {
				setWasTouched(true)
			}

			setValidationError(error)
		}, [field]),

		// ControlStateProps
		active: props.active,
		readOnly: fieldMetadata.isMutating,
		disabled: fieldMetadata.isMutating,
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
