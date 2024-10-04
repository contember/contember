import { Client, Issuer } from 'openid-client'
import { IdentityProviderHandler, IDPResponse, InitIDPAuthResult } from '../IdentityProviderHandler'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError'
import { catchTypesafe } from './helpers'
import { OIDCConfiguration, OIDCInitData, OIDCResponseData } from './OIDCTypes'
import { handleOIDCResponse, initOIDCAuth } from './OIDCHelpers'
import { IDPValidationError } from '../IDPValidationError'


export class OIDCProvider implements IdentityProviderHandler<OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}

	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: OIDCConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, {
			scope: configuration.scope ?? configuration.claims,
			...initData,
		})
	}

	public async processResponse(configuration: OIDCConfiguration, data: unknown): Promise<IDPResponse> {
		const responseData = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await handleOIDCResponse(client, responseData)
	}


	getPublicConfiguration({ clientSecret, ...config }: OIDCConfiguration): Partial<OIDCConfiguration> {
		return config
	}

	private async createOIDCClient(configuration: OIDCConfiguration): Promise<Client> {
		this.issuerCache[configuration.url] ??= await Issuer.discover(configuration.url)

		return new this.issuerCache[configuration.url].Client(
			{
				client_id: configuration.clientId,
				client_secret: configuration.clientSecret,
				response_types: [configuration.responseType || 'code'],
				id_token_signed_response_alg: configuration.idTokenSignedResponseAlg ?? 'RS256',
			},
			undefined,
			{
				additionalAuthorizedParties: [...(configuration.additionalAuthorizedParties ?? [])],
			},
		)
	}
}
