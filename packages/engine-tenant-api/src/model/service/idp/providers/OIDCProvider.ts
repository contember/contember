import { Client, custom, Issuer } from 'openid-client'
import { IdentityProviderHandler, IDPClaim, InitIDPAuthResult } from '../IdentityProviderHandler'
import { IDPValidationError } from '../IDPValidationError'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError'
import { catchTypesafe } from './helpers'
import { OIDCConfiguration, OIDCResponseData, OIDCSessionData } from './OIDCTypes'
import { handleOIDCResponse, initOIDCAuth } from './OIDCHelpers'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})


export class OIDCProvider implements IdentityProviderHandler<OIDCSessionData, OIDCResponseData, OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}
	validateResponseData = catchTypesafe(OIDCResponseData, IDPValidationError)
	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: OIDCConfiguration, redirectUrl: string): Promise<InitIDPAuthResult<OIDCSessionData>> {
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, redirectUrl, configuration)
	}

	public async processResponse(configuration: OIDCConfiguration, responseData: OIDCResponseData): Promise<IDPClaim> {
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
