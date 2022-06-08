import { ControlProps } from '../Types'
import { AllHTMLAttributes, ForwardedRef, RefObject, useCallback } from 'react'
import { useInputValue } from './useInputValue'
import { useNativeInput } from './useNativeInput'

export const useCheckboxInput = <E extends HTMLInputElement>(
	props: ControlProps<boolean>,
	forwardedRef: ForwardedRef<E>,
): AllHTMLAttributes<E> & { ref: RefObject<E>, indeterminate?: boolean } => {
	const { state, onChange } = useInputValue<boolean, E>({
		...props,
		emptyValue: false,
		extractValue: useCallback(element => element.indeterminate ? null : element.checked, []),
	})
	const inputProps = useNativeInput(props, forwardedRef)
	return {
		...inputProps,
		onChange,
		value: 'on',
		indeterminate: state === null,
		checked: state === true,
	}
}
