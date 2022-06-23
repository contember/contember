import { TenantIdentity } from '../dependencies/tenant/IdentityFetcher.js'
import { assertNever } from '../../utils/index.js'

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
