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
	id,
	name,
	onChange,
	notNull,
	placeholder,
	type,
	value,

	// ControlConstraintProps
	max,
	maxLength,
	min,
	minLength,
	pattern,

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
	// Intentionally unused
	const emptyRestTypeGuard: { [Property in keyof Partial<ControlProps<T>>]: never } = rest

	const ref = useRef<E>(null)
	useImperativeHandle(forwardedRef, () => ref.current as unknown as E)

	useChangeValidationState({ ref, onValidationStateChange })

	const onBlurListener = useCallback<FocusEventHandler<E>>((event => {
		if (event.defaultPrevented) {
			return
		}

		onBlur?.()
		onFocusChange?.(false)
	}), [onBlur, onFocusChange])

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
		ref,
		className,
		disabled: disabled || loading,
		id,
		name,
		onBlur: onBlurListener,
		onFocus: onFocusListener,
		placeholder: placeholder ?? undefined,
		readOnly: readOnly || loading,
		required,
		max: typeof max === 'number' || typeof max === 'string' ? max : undefined,
		maxLength,
		min: typeof min === 'number' || typeof min === 'string' ? min : undefined,
		minLength,
		pattern,
	}
}

export const useChangeValidationState = ({ ref, onValidationStateChange }: { ref: ForwardedRef<any>, onValidationStateChange?: (message: string) => void }): void => {
	const validationMessage = useRef<string>()

	useEffect(() => {
		if (!(ref && typeof ref === 'object' && onValidationStateChange)) {
			return
		}
		const valid = ref.current?.validity?.valid
		const message = valid ? undefined : ref.current?.validationMessage
		if (validationMessage.current !== message) {
			validationMessage.current = message
			onValidationStateChange(message)
		}
	})
}
