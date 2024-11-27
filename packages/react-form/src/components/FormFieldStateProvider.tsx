import { ErrorAccessor } from '@contember/react-binding'
import { useDebugValue, useEffect, useId, useMemo } from 'react'
import { FormFieldStateContext, useFormFieldState } from '../contexts'

const emptyArr: [] = []

export type FormFieldStateProvider = {
	errors?: ErrorAccessor.Error[]
	required?: boolean
	dirty?: boolean
	id?: string
	children: React.ReactNode
}
export const FormFieldStateProvider = ({ children, required = false, errors = emptyArr, dirty = false, id }: FormFieldStateProvider) => {
	const generatedId = useId()
	id ??= generatedId
	const value = useMemo(() => ({ id, required, errors, dirty }), [id, required, errors, dirty])
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
			<FormFieldStateProvider {...state} id={value}>
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
