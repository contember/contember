import { Identity, useIdentity as useOptionalIdentity } from '@contember/react-identity'

export const useIdentity = (): Identity => {
	const identity = useOptionalIdentity()
	if (!identity) {
		throw new Error('Identity context is not initialized')
	}
	return identity
}
