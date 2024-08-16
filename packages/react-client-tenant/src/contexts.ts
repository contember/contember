import { createContext, createRequiredContext } from '@contember/react-utils'
import { FormContextValue, Identity, IdentityMethods, IdentityStateValue, IDPMethods, IDPStateValue } from './types'

const IdentityContext_ = createContext<Identity | undefined>('IdentityContext', undefined)
/** @internal */
export const IdentityContext = IdentityContext_[0]
export const useIdentity = IdentityContext_[1]

const IdentityMethodsContext_ = createRequiredContext<IdentityMethods>('IdentityMethodsContext')
/** @internal */
export const IdentityMethodsContext = IdentityMethodsContext_[0]
export const useIdentityMethods = IdentityMethodsContext_[1]

const IdentityStateContext_ = createRequiredContext<IdentityStateValue>('IdentityStateContext')
/** @internal */
export const IdentityStateContext = IdentityStateContext_[0]
export const useIdentityState = IdentityStateContext_[1]


const FormContext_ = createRequiredContext<FormContextValue<any, any, any>>('FormContext')
/** @internal */
export const FormContext = FormContext_[0]
export const useForm = FormContext_[1]


const IDPStateContext = createRequiredContext<IDPStateValue>('IDPStateContext')
/** @internal */
export const IDPStateContextProvider = IDPStateContext[0]
export const useIDPState = IDPStateContext[1]

const IDPMethodsContext = createRequiredContext<IDPMethods>('IDPMethodsContext')
/** @internal */
export const IDPMethodsContextProvider = IDPMethodsContext[0]
export const useIDPMethods = IDPMethodsContext[1]
