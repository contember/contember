import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { ControlValueProps } from '../Types'

export type InputValueProps<T, E extends HTMLElement> =
	& ControlValueProps<T>
	& {
		required?: boolean
		emptyValue: T
		extractValue: (input: E) => T | null
	}
export const useInputValue = <T, E extends HTMLElement>(
	{
		defaultValue,
		value,
		onChange,
		notNull: notNull_,
		required,
		emptyValue,
		extractValue,
	}: InputValueProps<T, E>,
) => {
	const notNull = notNull_ || required
	const emptyOrNull = notNull ? emptyValue : null
	const [internalState, setInternalState] = useState<T | null>((value !== undefined ? value : defaultValue) ?? emptyOrNull)

	const onChangeRef = useRef(onChange)
	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	// Sync when outer value changes
	useEffect(() => {
		if (value === undefined) { // uncontrolled
			return
		}
		setInternalState(value ?? emptyOrNull)
	}, [emptyOrNull, emptyValue, notNull, value])


	const onChangeListener = useCallback<ChangeEventHandler<E>>(event => {
		const inputValue = extractValue(event.target)
		const normalizedValue = inputValue ?? emptyOrNull
		onChangeRef.current?.(normalizedValue)
		setInternalState(inputValue)
	}, [emptyOrNull, extractValue])

	return {
		onChange: onChangeListener,
		state: internalState,
	}
}
