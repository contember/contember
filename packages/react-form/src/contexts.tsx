import { createContext } from '@contember/react-utils'
import { FormFieldState } from './types'


const FormFieldStateContext_ = createContext<FormFieldState | undefined>('FormFieldStateContext', undefined)
export const FormFieldStateContext = FormFieldStateContext_[0]
export const useFormFieldState = FormFieldStateContext_[1]


/**
 * @deprecated use `useFormState` instead
 */
export const useFormFieldId = () => useFormFieldState()?.id

/**
 * @deprecated use `useFormState` instead
 */
export const useFormError = () => useFormFieldState()?.errors
