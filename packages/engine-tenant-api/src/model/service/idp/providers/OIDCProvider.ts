import { timingSafeEqual } from 'node:crypto'
import { Client, custom, CustomHttpOptionsProvider, Issuer } from 'openid-client'
import { EgressGuard } from '@contember/engine-common'
import {
	IdentityProviderHandler,
	IDPResponse,
	IDPSessionState,
	InitIDPAuthResult,
	LogoutTokenClaims,
	LogoutUrlRequest,
	RevalidationResult,
} from '../IdentityProviderHandler.js'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError.js'
import { catchTypesafe } from './helpers.js'
import { OIDCConfiguration, OIDCInitData, OIDCResponseData } from './OIDCTypes.js'
import {
	buildOIDCLogoutUrl,
	createRemoteJwksResolver,
	handleOIDCResponse,
	initOIDCAuth,
	RemoteJwksResolver,
	revalidateOIDC,
	validateOIDCLogoutToken,
} from './OIDCHelpers.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { DataSigner } from '../../../providers.js'

const DEFAULT_OIDC_TIMEOUT = 5000
const OFFLINE_ACCESS_SCOPE = 'offline_access'
const SESSION_DATA_SIGNING_PURPOSE = 'oidc-session-data'

export class OIDCProvider implements IdentityProviderHandler<OIDCConfiguration> {
	private issuerCache: Record<string, Issuer<Client>> = {}
	private readonly resolveJwks: RemoteJwksResolver
	/** Discovery, JWKS, token and userinfo requests all go to IdP-chosen URLs, so all of them pass the egress guard. */
	private readonly egressHttpOptions: CustomHttpOptionsProvider | undefined
	private readonly issuerClass: typeof Issuer<Client>

	constructor(
		egressGuard: EgressGuard | null,
		private readonly dataSigner: DataSigner | null,
	) {
		this.resolveJwks = createRemoteJwksResolver(egressGuard?.fetch)
		if (egressGuard) {
			const httpOptions: CustomHttpOptionsProvider = url => egressGuard.httpOptions(url)
			this.egressHttpOptions = httpOptions
			// `Issuer.discover` reads the http options of the class it is called on.
			this.issuerClass = class GuardedIssuer extends Issuer<Client> {
				static override [custom.http_options] = httpOptions
			}
		} else {
			this.egressHttpOptions = undefined
			this.issuerClass = Issuer
		}
	}

	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	validateWrittenConfiguration(configuration: OIDCConfiguration): void {
		// An unsigned ID token proves nothing about who signed in.
		if (configuration.idTokenSignedResponseAlg?.toLowerCase() === 'none') {
			throw new InvalidIDPConfigurationError('idTokenSignedResponseAlg "none" is not allowed; use a signing algorithm such as RS256')
		}
		if (configuration.strictResponseType && !this.dataSigner) {
			throw new InvalidIDPConfigurationError('strictResponseType requires an encryption key to sign session data; configure CONTEMBER_ENCRYPTION_KEY')
		}
	}

	public async initAuth(configuration: OIDCConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		const result = await initOIDCAuth(client, {
			scope: this.resolveScope(configuration),
			...initData,
		})
		if (!configuration.strictResponseType) {
			return result
		}
		const { nonce, state } = result.sessionData
		return { ...result, sessionData: { nonce, state, signature: this.signSessionData(configuration, nonce, state).toString('base64url') } }
	}

	public async processResponse(configuration: OIDCConfiguration, data: unknown): Promise<IDPResponse> {
		const { sessionData: { signature, ...sessionData } = {}, ...responseData } = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		if (configuration.strictResponseType) {
			this.verifySessionData(configuration, sessionData.nonce, sessionData.state, signature)
		}
		const client = await this.createOIDCClient(configuration)
		return await handleOIDCResponse(
			client,
			{ ...responseData, sessionData },
			{
				expectedResponseType: configuration.strictResponseType ? configuration.responseType || 'code' : undefined,
				fetchUserInfo: configuration.fetchUserInfo,
				returnOIDCResult: configuration.returnOIDCResult,
				captureSession: configuration.revalidation?.enabled === true,
				claimMapping: configuration.claimMapping,
			},
		)
	}

	public async revalidate(configuration: OIDCConfiguration, session: IDPSessionState): Promise<RevalidationResult> {
		const client = await this.createOIDCClient(configuration)
		return await revalidateOIDC(client, configuration.revalidation?.method ?? 'refresh', session, {
			claimMapping: configuration.claimMapping,
			fetchUserInfo: configuration.fetchUserInfo,
		})
	}

	public async buildLogoutUrl(configuration: OIDCConfiguration, request: LogoutUrlRequest): Promise<string | null> {
		const client = await this.createOIDCClient(configuration)
		return buildOIDCLogoutUrl(client, request)
	}

	public async validateLogoutToken(configuration: OIDCConfiguration, logoutToken: string): Promise<LogoutTokenClaims> {
		const client = await this.createOIDCClient(configuration)
		return await validateOIDCLogoutToken(client, client.issuer, logoutToken, this.resolveJwks)
	}

	/** Binds nonce and state to this provider, so a client cannot choose them for the callback. */
	private signSessionData(configuration: OIDCConfiguration, nonce: string, state: string): Buffer {
		if (!this.dataSigner) {
			throw new IDPValidationError('strictResponseType requires an encryption key to sign session data')
		}
		const payload = JSON.stringify([configuration.url, configuration.clientId, nonce, state])
		return this.dataSigner(SESSION_DATA_SIGNING_PURPOSE, Buffer.from(payload, 'utf8'))
	}

	private verifySessionData(
		configuration: OIDCConfiguration,
		nonce: string | undefined,
		state: string | undefined,
		signature: string | undefined,
	): void {
		if (nonce === undefined || state === undefined || signature === undefined) {
			throw new IDPValidationError('signed session data is required')
		}
		const expected = this.signSessionData(configuration, nonce, state)
		const actual = Buffer.from(signature, 'base64url')
		if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
			throw new IDPValidationError('session data signature is invalid')
		}
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
		this.issuerCache[configuration.url] ??= await this.discover(configuration.url)

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

		const timeout = configuration.timeout ?? DEFAULT_OIDC_TIMEOUT
		const egressHttpOptions = this.egressHttpOptions
		client[custom.http_options] = egressHttpOptions
			? (url, options) => ({ ...egressHttpOptions(url, options), timeout })
			: () => ({ timeout })

		return client
	}

	private async discover(url: string): Promise<Issuer<Client>> {
		const issuer = await this.issuerClass.discover(url)
		if (this.egressHttpOptions) {
			// The discovered issuer fetches its JWKS with its own http options.
			issuer[custom.http_options] = this.egressHttpOptions
		}
		return issuer
	}
}
