import { ErrorAccessor } from '@contember/react-binding'
import { useEffect, useId, useMemo } from 'react'
import { FormFieldStateContext, useFormFieldState } from '../contexts'
import { FormFieldState } from '../types'

const emptyArr: [] = []

export type FormFieldStateProvider =
	& Partial<FormFieldState>
	& {
		children: React.ReactNode
	}

export const FormFieldStateProvider = ({ children, required = false, errors = emptyArr, dirty = false, htmlId, field }: FormFieldStateProvider) => {
	const generatedId = useId()
	htmlId ??= generatedId
	const value = useMemo(() => ({ htmlId, required, errors, dirty, field }), [htmlId, required, errors, dirty, field])
	return <FormFieldStateContext.Provider value={value}>{children}</FormFieldStateContext.Provider>
}

/**
 * BC for
 * 	<FormFieldIdContext.Provider value={id}>
 * 	<FormErrorContext.Provider value={[]}>
 */

/**
 * @deprecated use `FormFieldStateProvider` instead
 */
export const FormFieldIdContext = {
	/**
	 * @deprecated use `FormFieldStateProvider` instead
	 */
	Provider: ({ children, value }: { children: React.ReactNode; value: string }) => {
		const state = useFormFieldState()
		if (import.meta.env.DEV) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useEffect(() => {
				console.warn('FormFieldIdContext.Provider is deprecated, use FormFieldStateProvider instead')
			}, [])
		}
		return (
			<FormFieldStateProvider {...state} htmlId={value}>
				{children}
			</FormFieldStateProvider>
		)
	},
}

/**
 * @deprecated use `FormFieldStateProvider` instead
 */
export const FormErrorContext = {
	/**
	 * @deprecated use `FormFieldStateProvider` instead
	 */
	Provider: ({ children, value }: { children: React.ReactNode; value: ErrorAccessor.Error[] }) => {
		const state = useFormFieldState()
		if (import.meta.env.DEV) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useEffect(() => {
				console.warn('FormErrorContext.Provider is deprecated, use FormFieldStateProvider instead')
			}, [])
		}
		return (
			<FormFieldStateProvider {...state} errors={value}>
				{children}
			</FormFieldStateProvider>
		)
	},
}
