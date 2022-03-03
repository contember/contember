import { Typesafe } from '@contember/engine-common'
import { Client, custom, errors, generators, Issuer, ResponseType } from 'openid-client'
import { IDPResponseError } from './IDPResponseError'
import { IdentityProviderHandler, IDPClaim, IDPResponse, InitIDPAuthResult } from './IdentityProviderHandler'
import { IDPValidationError } from './IDPValidationError'
import { InvalidIDPConfigurationError } from './InvalidIDPConfigurationError'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})

export type OIDCConfiguration = ReturnType<typeof OIDCConfigurationSchema>

export interface SessionData {
	nonce: string
	state: string
}

const OIDCConfigurationSchema = Typesafe.intersection(
	Typesafe.object({
		url: Typesafe.string,
		clientId: Typesafe.string,
		clientSecret: Typesafe.string,
	}),
	Typesafe.partial({
		responseType: Typesafe.enumeration<ResponseType>('code', 'code id_token', 'code id_token token', 'code token', 'id_token', 'id_token token', 'none'),
	}),
)

export class OIDCProvider implements IdentityProviderHandler<SessionData, OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}

	public async initAuth(
		configuration: OIDCConfiguration,
		redirectUrl: string,
	): Promise<InitIDPAuthResult<SessionData>> {
		const client = await this.createOIDCClient(configuration)
		const nonce = generators.nonce()
		const state = generators.state()
		const url = client.authorizationUrl({
			redirect_uri: redirectUrl,
			scope: 'openid email',
			nonce,
			state,
		})
		return {
			authUrl: url,
			sessionData: { nonce, state },
		}
	}

	public async processResponse(
		configuration: OIDCConfiguration,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: SessionData,
	): Promise<IDPClaim> {
		const client = await this.createOIDCClient(configuration)
		const params = client.callbackParams(idpResponse.url)
		try {
			const result = await client.callback(redirectUrl, params, sessionData)
			const claims = result.claims()
			if (!claims.email) {
				throw new IDPValidationError('email is missing in IDP response')
			}
			return {
				email: claims.email,
			}
		} catch (e) {
			if (e instanceof errors.RPError) {
				throw new IDPValidationError(e.message)
			}
			if (e instanceof errors.OPError) {
				throw new IDPResponseError(e.message)
			}
			throw e
		}
	}

	public validateConfiguration(config: unknown): OIDCConfiguration {
		try {
			return OIDCConfigurationSchema(config)
		} catch (e) {
			if (e instanceof Typesafe.ParseError) {
				throw new InvalidIDPConfigurationError(e.message)
			}
			throw e
		}
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
