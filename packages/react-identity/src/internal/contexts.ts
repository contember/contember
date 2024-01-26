import { createContext, createRequiredContext } from '@contember/react-utils'
import { IdentityMethods } from '../types/IdentityMethods'
import { Identity } from '../types/Identity'
import { IdentityStateValue } from '../types/IdentityStateValue'

export const [IdentityContext, useIdentity] = createContext<Identity | undefined>('IdentityContext', undefined)
export const [IdentityMethodsContext, useIdentityMethods] = createRequiredContext<IdentityMethods>('IdentityMethodsContext')
export const [IdentityStateContext, useIdentityState] = createRequiredContext<IdentityStateValue>('IdentityStateContext')
