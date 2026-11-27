import { timingSafeEqual } from 'node:crypto'
import { Configuration, CustomFetch, customFetch, discovery } from 'openid-client'
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
	clientAuthFor,
	COMMON_SETUP,
	createRemoteJwksResolver,
	discoveryTarget,
	egressCustomFetch,
	flowOfResponseType,
	flowSetup,
	handleOIDCResponse,
	initOIDCAuth,
	OIDCFlow,
	RemoteJwksResolver,
	revalidateOIDC,
	unwrapForeignError,
	validateOIDCLogoutToken,
} from './OIDCHelpers.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { DataSigner } from '../../../providers.js'

const DEFAULT_OIDC_TIMEOUT = 5000
const OFFLINE_ACCESS_SCOPE = 'offline_access'
const SESSION_DATA_SIGNING_PURPOSE = 'oidc-session-data'
const MAX_CACHED_CLIENTS = 100

export class OIDCProvider implements IdentityProviderHandler<OIDCConfiguration> {
	/**
	 * Discovered clients by everything they are built from, so discovery runs once per IdP URL and the JWKS cached on a
	 * client is reused. A client cannot be rebuilt from cached metadata: the Entra ID `{tenantid}` handling exists only
	 * on a client `discovery` returned.
	 */
	private readonly clients = new Map<string, Promise<Configuration>>()
	private readonly resolveJwks: RemoteJwksResolver
	/** Discovery, JWKS, token and userinfo requests all go to IdP-chosen URLs, so all of them pass the egress guard. */
	private readonly fetch: CustomFetch | undefined

	constructor(
		egressGuard: EgressGuard | null,
		private readonly dataSigner: DataSigner | null,
	) {
		this.resolveJwks = createRemoteJwksResolver(egressGuard?.fetch)
		this.fetch = egressGuard ? egressCustomFetch(egressGuard.fetch) : undefined
	}

	validateConfiguration = catchTypesafe(OIDCConfiguration, InvalidIDPConfigurationError)

	validateWrittenConfiguration(configuration: OIDCConfiguration): void {
		// An unsigned ID token proves nothing about who signed in.
		if (configuration.idTokenSignedResponseAlg?.toLowerCase() === 'none') {
			throw new InvalidIDPConfigurationError('idTokenSignedResponseAlg "none" is not allowed; use a signing algorithm such as RS256')
		}
		// openid-client verifies ID tokens only against keys the IdP publishes, never with the client secret
		if (configuration.idTokenSignedResponseAlg?.toUpperCase().startsWith('HS')) {
			throw new InvalidIDPConfigurationError(
				`idTokenSignedResponseAlg "${configuration.idTokenSignedResponseAlg}" is not supported; use an asymmetric algorithm such as RS256`,
			)
		}
		if (configuration.strictResponseType && !this.dataSigner) {
			throw new InvalidIDPConfigurationError('strictResponseType requires an encryption key to sign session data; configure CONTEMBER_ENCRYPTION_KEY')
		}
	}

	public async initAuth(configuration: OIDCConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const responseType = configuration.responseType || 'code'
		const client = await this.createOIDCClient(configuration, flowOfResponseType(responseType))
		const result = initOIDCAuth(client, {
			scope: this.resolveScope(configuration),
			responseType,
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
		return await handleOIDCResponse(
			flow => this.createOIDCClient(configuration, flow),
			{ ...responseData, sessionData },
			{
				expectedResponseType: configuration.strictResponseType ? configuration.responseType || 'code' : undefined,
				fetchUserInfo: configuration.fetchUserInfo,
				returnOIDCResult: configuration.returnOIDCResult,
				captureSession: configuration.revalidation?.enabled === true,
				claimMapping: configuration.claimMapping,
				additionalAuthorizedParties: configuration.additionalAuthorizedParties,
			},
		)
	}

	public async revalidate(configuration: OIDCConfiguration, session: IDPSessionState): Promise<RevalidationResult> {
		const client = await this.createConfiguredClient(configuration)
		return await revalidateOIDC(client, configuration.revalidation?.method ?? 'refresh', session, {
			claimMapping: configuration.claimMapping,
			fetchUserInfo: configuration.fetchUserInfo,
			additionalAuthorizedParties: configuration.additionalAuthorizedParties,
		})
	}

	public async buildLogoutUrl(configuration: OIDCConfiguration, request: LogoutUrlRequest): Promise<string | null> {
		const client = await this.createConfiguredClient(configuration)
		return buildOIDCLogoutUrl(client, request)
	}

	public async validateLogoutToken(configuration: OIDCConfiguration, logoutToken: string): Promise<LogoutTokenClaims> {
		const client = await this.createConfiguredClient(configuration)
		return await validateOIDCLogoutToken(client, logoutToken, this.resolveJwks)
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

	/** The client of the configured response type's flow, which sign-in used, so it shares that client's discovery. */
	private async createConfiguredClient(configuration: OIDCConfiguration): Promise<Configuration> {
		return await this.createOIDCClient(configuration, flowOfResponseType(configuration.responseType || 'code'))
	}

	private async createOIDCClient(configuration: OIDCConfiguration, flow: OIDCFlow): Promise<Configuration> {
		const key = JSON.stringify([
			configuration.url,
			configuration.clientId,
			configuration.clientSecret,
			configuration.tokenEndpointAuthMethod,
			configuration.idTokenSignedResponseAlg,
			configuration.timeout,
			flow,
		])
		const cached = this.clients.get(key)
		// re-inserted on every use, so the map's order is least recently used first
		this.clients.delete(key)
		const client = cached ?? this.discover(configuration, flow)
		this.clients.set(key, client)
		if (cached === undefined) {
			// a failed discovery is retried on the next call
			client.catch(() => {
				if (this.clients.get(key) === client) {
					this.clients.delete(key)
				}
			})
		}
		// every configuration change (a rotated secret, a new timeout) adds a key
		if (this.clients.size > MAX_CACHED_CLIENTS) {
			const [leastRecentlyUsed] = this.clients.keys()
			this.clients.delete(leastRecentlyUsed)
		}
		return await client
	}

	private async discover(configuration: OIDCConfiguration, flow: OIDCFlow): Promise<Configuration> {
		return await discovery(
			discoveryTarget(configuration.url),
			configuration.clientId,
			{
				client_secret: configuration.clientSecret,
				id_token_signed_response_alg: configuration.idTokenSignedResponseAlg ?? 'RS256',
			},
			clientAuthFor(configuration.tokenEndpointAuthMethod, configuration.clientSecret),
			{
				...(this.fetch ? { [customFetch]: this.fetch } : {}),
				// openid-client 6 counts seconds, the configuration milliseconds
				timeout: (configuration.timeout ?? DEFAULT_OIDC_TIMEOUT) / 1000,
				execute: [...COMMON_SETUP, ...flowSetup(flow)],
			},
		).catch(e => {
			throw unwrapForeignError(e)
		})
	}
}
