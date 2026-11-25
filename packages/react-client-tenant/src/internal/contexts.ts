import { createContext } from '@contember/react-utils'

const IdentityFetchAbortControllerContext_ = createContext<AbortController | undefined>('IdentityFetchAbortControllerContext', undefined)
/** Aborts the identity (`me`) query of the enclosing `IdentityProvider`; undefined outside of one. */
export const IdentityFetchAbortControllerContext = IdentityFetchAbortControllerContext_[0]
export const useIdentityFetchAbortController = IdentityFetchAbortControllerContext_[1]
