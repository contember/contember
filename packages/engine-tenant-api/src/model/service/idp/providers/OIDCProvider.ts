import { Client, custom, Issuer } from 'openid-client'
import { IdentityProviderHandler, IDPResponse, IDPSessionState, InitIDPAuthResult, RevalidationResult } from '../IdentityProviderHandler.js'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError.js'
import { catchTypesafe } from './helpers.js'
import { OIDCConfiguration, OIDCInitData, OIDCResponseData } from './OIDCTypes.js'
import { handleOIDCResponse, initOIDCAuth, revalidateOIDC } from './OIDCHelpers.js'
import { IDPValidationError } from '../IDPValidationError.js'

const DEFAULT_OIDC_TIMEOUT = 5000
const OFFLINE_ACCESS_SCOPE = 'offline_access'

export class OIDCProvider implements IdentityProviderHandler<OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}

	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: OIDCConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, {
			scope: this.resolveScope(configuration),
			...initData,
		})
	}

	public async processResponse(configuration: OIDCConfiguration, data: unknown): Promise<IDPResponse> {
		const responseData = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await handleOIDCResponse(
			client,
			responseData,
			{
				fetchUserInfo: configuration.fetchUserInfo,
				returnOIDCResult: configuration.returnOIDCResult,
				captureSession: configuration.revalidation?.enabled === true,
				claimMapping: configuration.claimMapping,
			},
		)
	}

	public async revalidate(configuration: OIDCConfiguration, session: IDPSessionState): Promise<RevalidationResult> {
		const client = await this.createOIDCClient(configuration)
		return await revalidateOIDC(client, configuration.revalidation?.method ?? 'refresh', session)
	}

	/**
	 * Resolve the requested scope, appending `offline_access` when refresh-token
	 * re-validation is enabled (so the IdP issues a refresh token to revalidate against).
	 */
	private resolveScope(configuration: OIDCConfiguration): string {
		const baseScope = configuration.scope ?? configuration.claims ?? 'openid email'
		const needsOfflineAccess = configuration.revalidation?.enabled === true
			&& (configuration.revalidation.method ?? 'refresh') === 'refresh'
		if (needsOfflineAccess && !baseScope.split(/\s+/).includes(OFFLINE_ACCESS_SCOPE)) {
			return `${baseScope} ${OFFLINE_ACCESS_SCOPE}`
		}
		return baseScope
	}

	getPublicConfiguration({ clientSecret, ...config }: OIDCConfiguration): Partial<OIDCConfiguration> {
		return config
	}

	private async createOIDCClient(configuration: OIDCConfiguration): Promise<Client> {
		this.issuerCache[configuration.url] ??= await Issuer.discover(configuration.url)

		const client = new this.issuerCache[configuration.url].Client(
			{
				client_id: configuration.clientId,
				client_secret: configuration.clientSecret,
				response_types: [configuration.responseType || 'code'],
				id_token_signed_response_alg: configuration.idTokenSignedResponseAlg ?? 'RS256',
				...(configuration.tokenEndpointAuthMethod ? { token_endpoint_auth_method: configuration.tokenEndpointAuthMethod } : {}),
			},
			undefined,
			{
				additionalAuthorizedParties: [...(configuration.additionalAuthorizedParties ?? [])],
			},
		)

		client[custom.http_options] = () => ({ timeout: configuration.timeout ?? DEFAULT_OIDC_TIMEOUT })

		return client
	}
}
