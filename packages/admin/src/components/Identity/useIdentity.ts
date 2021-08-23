import { useContext } from 'react'
import { Identity, IdentityContext } from './IdentityProvider'

export const useIdentity = (): Identity => {
	const ctx = useContext(IdentityContext)
	if (!ctx) {
		throw new Error('Identity context is not initialized')
	}
	return ctx.identity
}
