import { useContext } from 'react'
import { Identity, IdentityContext } from './IdentityProvider'

export const useOptionalIdentity = (): Identity | undefined => {
	return useContext(IdentityContext)?.identity
}
