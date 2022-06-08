import {
	AllHTMLAttributes,
	FocusEventHandler,
	ForwardedRef, RefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from 'react'
import type { ControlProps } from '../Types'
import { useInputClassName } from './useInputClassName'

export function useNativeInput<E extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, T>({
	// ControlStateProps
	active,
	disabled,
	loading,
	readOnly,
	required,
	focused,
	hovered,

	// ControlFocusProps
	onBlur,
	onFocus,
	onFocusChange,

	// ControlValueProps
	defaultValue,
	name,
	max,
	min,
	onChange,
	notNull,
	placeholder,
	type,
	value,

	// ValidationStateProps
	onValidationStateChange,
	validationState,

	// ControlDisplayProps
	className: outerClassName,
	distinction,
	intent,
	scheme,
	size,

	// Common own props
	...rest
}: ControlProps<T>,
	forwardedRef: ForwardedRef<E>,
): AllHTMLAttributes<E> & { ref: RefObject<E> } {
	const ref = useRef<E>(null)
	useImperativeHandle(forwardedRef, () => ref.current as unknown as E)

	const changeValidationState = useChangeValidationState({ ref, onValidationStateChange })

	const onBlurListener = useCallback<FocusEventHandler<E>>((event => {
		if (event.defaultPrevented) {
			return
		}

		onBlur?.()
		onFocusChange?.(false)
		changeValidationState()
	}), [onBlur, onFocusChange, changeValidationState])

	const onFocusListener = useCallback<FocusEventHandler<E>>(event => {
		onFocus?.()
		onFocusChange?.(true)
	}, [onFocus, onFocusChange])

	const className = useInputClassName({
		// ControlStateProps
		active,
		disabled,
		loading,
		readOnly,
		required,
		focused,
		hovered,

		// ControlDisplayProps
		className: outerClassName,
		distinction,
		intent,
		scheme,
		size,

		// ValidationStateProps
		validationState,
	})

	if (import.meta.env.DEV) {
		const unexpectedBooleans = Object.keys(rest).filter(key => key.match(/\bis[A-Z]\w*$/))

		if (unexpectedBooleans.length) {
			console.warn('Native elements do expect booleans without "is" prefix.', { unexpectedBooleans })
		}
	}

	return {
		...rest,
		ref,
		className,
		disabled: disabled || loading,
		name,
		onBlur: onBlurListener,
		onFocus: onFocusListener,
		placeholder: placeholder ?? undefined,
		readOnly: readOnly || loading,
		required,
		max: max !== null && max !== undefined ? String(max) : undefined,
		min: min !== null && min !== undefined ? String(min) : undefined,
	}
}

const useChangeValidationState = ({ ref, onValidationStateChange }: { ref: ForwardedRef<any>, onValidationStateChange?: (message: string) => void }) => {
	const validationMessage = useRef<string>()
	const changeValidationState = useCallback(() => {
		if (!(ref && typeof ref === 'object' && onValidationStateChange)) {
			return
		}
		const valid = ref.current?.validity?.valid
		const message = valid ? undefined : ref.current?.validationMessage
		if (validationMessage.current !== message) {
			validationMessage.current = message
			onValidationStateChange(message)
		}
	}, [onValidationStateChange, ref])

	useEffect(() => {
		changeValidationState()
	}, [changeValidationState])

	return changeValidationState
}

