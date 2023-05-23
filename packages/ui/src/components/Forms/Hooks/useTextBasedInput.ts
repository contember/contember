import { ControlProps } from '../Types'
import { AllHTMLAttributes, ForwardedRef, RefObject, useCallback } from 'react'
import { useInputValue } from './useInputValue'
import { useNativeInput } from './useNativeInput'

export const useTextBasedInput = <E extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
	props: ControlProps<string>,
	forwardedRef: ForwardedRef<E>,
): AllHTMLAttributes<E> & { ref: RefObject<E> } => {
	const { state, onChange } = useInputValue<string, E>({
		...props,
		emptyValue: '',
		extractValue: useCallback(input => input.value, []),
	})
	const inputProps = useNativeInput(props, forwardedRef)
	return {
		...inputProps,
		onChange,
		value: state ?? '',
	}
}
