import { SelectBuilder } from '@contember/database'
import { IdentityProviderRow } from './types'

export const createBaseIdpQuery = () =>
	SelectBuilder.create<IdentityProviderRow>()
		.select('id')
		.select('slug')
		.select('type')
		.select('configuration')
		.select('disabled_at', 'disabledAt')
		.from('identity_provider')
