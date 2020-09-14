import { InvalidIDPConfigurationError } from './InvalidIDPConfigurationError'
import { hasStringProperty, isObject } from '@contember/engine-common'
import { Client, errors, generators, Issuer, custom, ResponseType } from 'openid-client'
import { IDPResponseError } from './IDPResponseError'
import { IdentityProvider, IDPClaim, IDPResponse, InitIDPAuthResult } from './IdentityProvider'
import { IDPValidationError } from './IDPValidationError'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})

export interface OIDCConfiguration {
	url: string
	clientId: string
	clientSecret: string
	responseType?: ResponseType
}

export interface SessionData {
	nonce: string
	state: string
}

export class OIDCProvider implements IdentityProvider<SessionData, OIDCConfiguration> {
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
		if (!isObject(config)) {
			throw new InvalidIDPConfigurationError('Configuration must be an object')
		}
		if (!hasStringProperty(config, 'url')) {
			throw new InvalidIDPConfigurationError('url must be a string')
		}
		if (!hasStringProperty(config, 'clientId')) {
			throw new InvalidIDPConfigurationError('clientId must be a string')
		}
		if (!hasStringProperty(config, 'clientSecret')) {
			throw new InvalidIDPConfigurationError('clientSecret must be a string')
		}
		if (config.responseType && !hasStringProperty(config, 'clientId')) {
			throw new InvalidIDPConfigurationError('responseType must be a string')
		}
		return config
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
