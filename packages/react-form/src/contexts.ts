import { createContext } from '@contember/react-utils'
import { ErrorAccessor } from '@contember/react-binding'

const FormFieldIdContext_ = createContext<string | undefined>('FormFieldIdContext', undefined)
/** @internal */
export const FormFieldIdContext = FormFieldIdContext_[0]
export const useFormFieldId = FormFieldIdContext_[1]

const FormErrorContext_ = createContext<ErrorAccessor.Error[] | undefined>('FormErrorContext', undefined)
/** @internal */
export const FormErrorContext = FormErrorContext_[0]
export const useFormError = FormErrorContext_[1]
