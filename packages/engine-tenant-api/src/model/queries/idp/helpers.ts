import { SelectBuilder } from '@contember/database'
import { IdentityProviderDto, IdentityProviderRow } from './types'

export const createBaseIdpQuery = () =>
	SelectBuilder.create<IdentityProviderRow>()
		.select('id')
		.select('slug')
		.select('type')
		.select('configuration')
		.select('disabled_at', 'disabledAt')
		.select('auto_sign_up', 'autoSignUp')
		.select('exclusive')
		.select('init_returns_config', 'initReturnsConfig')
		.select('require_verified_email', 'requireVerifiedEmail')
		.from('identity_provider')

export const createIdpDto = (
	{ exclusive, autoSignUp, initReturnsConfig, requireVerifiedEmail, ...row }: IdentityProviderRow,
): IdentityProviderDto => {
	return {
		...row,
		options: { autoSignUp, exclusive, initReturnsConfig, requireVerifiedEmail },
	}
}
