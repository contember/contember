import { BindingError } from '@contember/binding'
import { Identity } from './IdentityProvider'

export const identityEnvironmentExtension = (state: Identity | null | undefined) => {
	if (state === undefined) {
		throw new BindingError('Environment does not contain identity state.')
	}

	return {
		identity: state ?? undefined,
	}
}
