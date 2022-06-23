import { SelectBuilder } from '@contember/database'
import { IdentityProviderRow } from './types.js'

export const createBaseIdpQuery = () =>
	SelectBuilder.create<IdentityProviderRow>()
		.select('id')
		.select('slug')
		.select('type')
		.select('configuration')
		.select('disabled_at', 'disabledAt')
		.select('auto_sign_up', 'autoSignUp')
		.from('identity_provider')
