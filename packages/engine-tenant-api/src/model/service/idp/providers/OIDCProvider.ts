import { Client, custom, Issuer } from 'openid-client'
import { IdentityProviderHandler, IDPClaim, InitIDPAuthResult } from '../IdentityProviderHandler'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError'
import { catchTypesafe } from './helpers'
import { OIDCConfiguration, OIDCInitData, OIDCResponseData } from './OIDCTypes'
import { handleOIDCResponse, initOIDCAuth } from './OIDCHelpers'
import { IDPValidationError } from '../IDPValidationError'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})


export class OIDCProvider implements IdentityProviderHandler<OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}

	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: OIDCConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, {
			claims: configuration.claims,
			...initData,
		})
	}

	public async processResponse(configuration: OIDCConfiguration, data: unknown): Promise<IDPClaim> {
		const responseData = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await handleOIDCResponse(client, responseData)
	}


	private async createOIDCClient(configuration: OIDCConfiguration): Promise<Client> {
		this.issuerCache[configuration.url] ??= await Issuer.discover(configuration.url)

		return new this.issuerCache[configuration.url].Client({
			client_id: configuration.clientId,
			client_secret: configuration.clientSecret,
			response_types: [configuration.responseType || 'code'],
		})
	}
}
