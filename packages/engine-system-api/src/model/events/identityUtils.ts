import { TenantIdentity } from '../dependencies/tenant/IdentityFetcher'
import { assertNever } from '../../utils'

export const formatIdentity = (identity: TenantIdentity): string => {
	if (!identity) {
		return '(unknown)'
	}
	if (identity.type === 'person') {
		return identity.person.name
	} else if (identity.type === 'apiKey') {
		return `API key (${identity.description})`
	}
	assertNever(identity)
}
