import { BindingError, Environment } from '@contember/react-binding'
import { Identity } from './IdentityProvider'

export const identityEnvironmentExtension = Environment.createExtension((state: Identity | null | undefined) => {
	if (state === undefined) {
		throw new BindingError('Environment does not contain identity state.')
	}

	return {
		identity: state ?? undefined,
	}
})
