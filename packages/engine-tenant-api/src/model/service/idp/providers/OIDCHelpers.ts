import { createHash } from 'node:crypto'
import {
	allowInsecureRequests,
	authorizationCodeGrant,
	AuthorizationResponseError,
	buildAuthorizationUrl,
	buildEndSessionUrl,
	ClientAuth,
	ClientError,
	ClientSecretJwt,
	ClientSecretPost,
	Configuration,
	CustomFetch,
	enableNonRepudiationChecks,
	ExportedJWKSCache,
	FetchBody,
	fetchUserInfo,
	getJwksCache,
	IDToken,
	implicitAuthentication,
	JsonValue,
	None,
	randomNonce,
	randomState,
	refreshTokenGrant,
	ResponseBodyError,
	setJwksCache,
	skipSubjectCheck,
	TlsClientAuth,
	TokenEndpointResponse,
	tokenIntrospection,
	useCodeIdTokenResponseType,
	useIdTokenResponseType,
	WWWAuthenticateChallengeError,
} from 'openid-client'
import { createRemoteJWKSet, customFetch, decodeJwt, decodeProtectedHeader, FetchImplementation, jwtVerify } from 'jose'
import { EgressFetch } from '@contember/engine-common'
import { OIDCClaimMapping, OIDCConfigurationOptions, OIDCResponseData } from './OIDCTypes.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { IDPResponseError } from '../IDPResponseError.js'
import {
	IDPResponse,
	IDPSessionState,
	InitIDPAuthResult,
	LogoutTokenClaims,
	LogoutUrlRequest,
	RevalidationResult,
} from '../IdentityProviderHandler.js'

type TokenEndpointAuthMethod = NonNullable<ReturnType<typeof OIDCConfigurationOptions>['tokenEndpointAuthMethod']>

/**
 * How openid-client validates an authorization response: a code alone, a code with an ID token beside it, or an ID
 * token alone. A {@link Configuration} serves one of them, so a provider keeps one per flow.
 */
export type OIDCFlow = 'code' | 'hybrid' | 'implicit'

/** The flow of a configured `responseType`; a `token` part changes nothing, its access token is checked by `at_hash`. */
export const flowOfResponseType = (responseType: string): OIDCFlow => {
	const parts = responseType.split(' ')
	if (parts.includes('code')) {
		return parts.includes('id_token') ? 'hybrid' : 'code'
	}
	return parts.includes('id_token') ? 'implicit' : 'code'
}

/** Selects the flow on a {@link Configuration}; pass it as `execute` to `discovery`, or call it on a constructed one. */
export const flowSetup = (flow: OIDCFlow): ((config: Configuration) => void)[] => {
	switch (flow) {
		case 'code':
			return []
		case 'hybrid':
			return [useCodeIdTokenResponseType]
		case 'implicit':
			return [useIdTokenResponseType]
	}
}

/**
 * Executed on every {@link Configuration}, to keep what openid-client 5 did: plain-HTTP endpoints are allowed (the
 * egress policy decides which schemes an IdP may use), and an ID token from the token endpoint has its signature
 * verified against the JWKS, where v6 would trust the TLS connection instead.
 */
export const COMMON_SETUP: ((config: Configuration) => void)[] = [allowInsecureRequests, enableNonRepudiationChecks]

/** `application/x-www-form-urlencoded` as openid-client 5 did it: `- _ . ! ~ * ' ( )` stay unencoded. */
const formUrlEncode = (value: string): string => encodeURIComponent(value).replace(/%20/g, '+')

/** openid-client 6 percent-encodes `- _ . ! ~ * ' ( )` too, which an IdP that does not decode the credentials rejects. */
const clientSecretBasic = (clientSecret: string): ClientAuth => (_as, client, _body, headers) => {
	const credentials = `${formUrlEncode(client.client_id)}:${formUrlEncode(clientSecret)}`
	headers.set('authorization', `Basic ${Buffer.from(credentials).toString('base64')}`)
}

/** openid-client 5's default: `client_secret_basic`, unless the IdP advertises only `client_secret_post` of the two. */
export const defaultClientAuth = (clientSecret: string): ClientAuth => {
	const basic = clientSecretBasic(clientSecret)
	const post = ClientSecretPost(clientSecret)
	return (as, client, body, headers) => {
		const supported = as.token_endpoint_auth_methods_supported
		const usePost = supported !== undefined && !supported.includes('client_secret_basic') && supported.includes('client_secret_post')
		return (usePost ? post : basic)(as, client, body, headers)
	}
}

/** The client authentication for a configured `tokenEndpointAuthMethod`, on the token and introspection endpoints alike. */
export const clientAuthFor = (method: TokenEndpointAuthMethod | undefined, clientSecret: string): ClientAuth => {
	switch (method) {
		case undefined:
			return defaultClientAuth(clientSecret)
		case 'client_secret_basic':
			return clientSecretBasic(clientSecret)
		case 'client_secret_post':
			return ClientSecretPost(clientSecret)
		case 'client_secret_jwt':
			return ClientSecretJwt(clientSecret)
		case 'none':
			return None()
		case 'tls_client_auth':
		case 'self_signed_tls_client_auth':
			// the certificate would come from the HTTP client, which is not configurable; only the client id is sent
			return TlsClientAuth()
		case 'private_key_jwt':
			throw new IDPValidationError('private_key_jwt client authentication needs a client key, which an IdP configuration cannot hold')
	}
}

const requestBody = (body: FetchBody): string | undefined => {
	if (body === undefined || body === null || typeof body === 'string') {
		return body ?? undefined
	}
	if (body instanceof URLSearchParams) {
		return body.toString()
	}
	throw new TypeError('unsupported request body')
}

/** openid-client's fetch over the egress guard's, which takes a string body only. */
export const egressCustomFetch = (fetch: EgressFetch): CustomFetch => async (url, options) =>
	await fetch(url, {
		method: options.method,
		headers: options.headers,
		body: requestBody(options.body),
		redirect: options.redirect,
		signal: options.signal,
	})

/**
 * Where openid-client 5 looked for the discovery document: the configured URL itself when it already points at a
 * `/.well-known/` document, otherwise `/.well-known/openid-configuration` appended to its path.
 */
const discoveryDocumentUrl = (url: string): URL => {
	const parsed = new URL(url)
	if (!parsed.pathname.includes('/.well-known/')) {
		parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/.well-known/openid-configuration`
	}
	return parsed
}

const MICROSOFT_ORIGIN = 'https://login.microsoftonline.com'
const WELL_KNOWN_SUFFIX = '/.well-known/openid-configuration'
/** The Entra ID multi-tenant discovery documents, whose `issuer` carries a `{tenantid}` template. */
const MICROSOFT_MULTITENANT_PATHS = ['/common', '/common/v2.0', '/organizations/v2.0', '/consumers/v2.0'].map(it => `${it}${WELL_KNOWN_SUFFIX}`)

/**
 * The URL to hand to openid-client's `discovery`. A document URL makes it skip comparing the advertised `issuer` with
 * the configured URL, which v5 never compared. Only the Entra ID multi-tenant documents go by their issuer URL: that
 * is the one path on which openid-client substitutes `{tenantid}` in the issuer from the ID token's `tid`, as v5 did.
 */
export const discoveryTarget = (url: string): URL => {
	const document = discoveryDocumentUrl(url)
	if (document.origin === MICROSOFT_ORIGIN && MICROSOFT_MULTITENANT_PATHS.includes(document.pathname)) {
		document.pathname = document.pathname.slice(0, -WELL_KNOWN_SUFFIX.length)
	}
	return document
}

/**
 * Carries the JWKS one client fetched over to the next client of the same IdP, for providers that build a client per
 * call; openid-client keeps the keys on the client.
 */
export class JwksCarrier {
	private cache: ExportedJWKSCache | undefined

	/** Runs `use` with clients from `create` that start from the carried keys, and carries on what they end with. */
	async run<T>(create: (flow: OIDCFlow) => Configuration, use: (clientFor: (flow: OIDCFlow) => Promise<Configuration>) => Promise<T>): Promise<T> {
		const clients: Configuration[] = []
		try {
			return await use(async flow => {
				const client = create(flow)
				if (this.cache) {
					setJwksCache(client, this.cache)
				}
				clients.push(client)
				return client
			})
		} finally {
			for (const client of clients) {
				this.cache = getJwksCache(client) ?? this.cache
			}
		}
	}
}

/**
 * The tokens of a completed sign-in or refresh, shaped as openid-client 5's `TokenSet`: what the IdP returned, with
 * `expires_in` turned into an absolute `expires_at` (epoch seconds) at receipt.
 */
export type OIDCTokenSet = {
	readonly access_token?: string
	readonly id_token?: string
	readonly refresh_token?: string
	readonly expires_at?: number
	readonly [parameter: string]: JsonValue | undefined
}

const expiresAt = (expiresIn: number | undefined): { expires_at?: number } =>
	expiresIn !== undefined && Number.isFinite(expiresIn) ? { expires_at: Math.floor(Date.now() / 1000) + expiresIn } : {}

const tokenSetOf = ({ expires_in, ...rest }: TokenEndpointResponse): OIDCTokenSet => ({ ...rest, ...expiresAt(expires_in) })

/** The tokens of an implicit response come from the redirect itself. */
const tokenSetOfParameters = ({ expires_in, ...rest }: Record<string, string>): OIDCTokenSet => ({
	...rest,
	...expiresAt(expires_in !== undefined ? Number(expires_in) : undefined),
})

/**
 * Build the persisted session state from an OIDC token set. Stores the tokens needed for
 * later re-validation (refresh/access) and SLO (id_token); the whole `tokens` blob is
 * encrypted at rest by the command layer.
 *
 * `prevTokens` carries the previously stored tokens forward: a refresh-grant response MAY omit
 * the refresh token (RFC 6749 §6 — IdPs that don't rotate just don't re-send it), in which case
 * the client must keep using the old one. Without this fallback a non-rotating IdP would persist
 * a session with no refresh token and be revoked (`no_refresh_token`) on the very next tick.
 */
export const tokenSetToSessionState = (tokenSet: OIDCTokenSet, sessionId?: string, prevTokens?: Record<string, unknown>): IDPSessionState => {
	const refreshToken = tokenSet.refresh_token ?? (typeof prevTokens?.refresh_token === 'string' ? prevTokens.refresh_token : undefined)
	const idToken = tokenSet.id_token ?? (typeof prevTokens?.id_token === 'string' ? prevTokens.id_token : undefined)
	return {
		sessionId,
		tokens: {
			...(refreshToken ? { refresh_token: refreshToken } : {}),
			...(tokenSet.access_token ? { access_token: tokenSet.access_token } : {}),
			...(idToken ? { id_token: idToken } : {}),
		},
		expiresAt: tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) : undefined,
	}
}

export const initOIDCAuth = (
	client: Configuration,
	{ redirectUrl, scope, responseMode, responseType }: { redirectUrl: string; scope?: string; responseMode?: string; responseType: string },
): InitIDPAuthResult & { sessionData: { nonce: string; state: string } } => {
	const nonce = randomNonce()
	const state = randomState()
	const url = buildAuthorizationUrl(client, {
		redirect_uri: redirectUrl,
		scope: scope ?? 'openid email',
		response_type: responseType,
		nonce,
		state,
		...(responseMode !== undefined ? { response_mode: responseMode } : {}),
	})

	return {
		authUrl: url.href,
		sessionData: { nonce, state },
	}
}

export type HandleOIDCResponseOptions = {
	/** When set, the callback must match this response type exactly (see `strictResponseType`). */
	expectedResponseType?: string
	fetchUserInfo?: boolean
	returnOIDCResult?: boolean
	captureSession?: boolean
	claimMapping?: OIDCClaimMapping
	/** `azp` values accepted besides the client id. */
	additionalAuthorizedParties?: readonly string[]
}

/**
 * Read a claim by name, supporting dot-paths into nested objects (`a.b.c`). Own-property only at every
 * segment (mirrors `ClaimMappingEvaluator.resolvePath`): a configured path must never descend into an
 * inherited member, so a `__proto__` / `constructor` segment cannot surface an `Object.prototype` value
 * as the externalIdentifier / email / name.
 */
const getClaim = (source: Record<string, unknown>, path: string): unknown =>
	path.split('.').reduce<unknown>(
		(
			acc,
			key,
		) => (acc != null && typeof acc === 'object' && Object.prototype.hasOwnProperty.call(acc, key) ? (acc as Record<string, unknown>)[key] : undefined),
		source,
	)

/**
 * Lift a configured nested attributes object (`attributesKey`, notably Apereo CAS's `attributes`) to the
 * top level so providers that nest their claims map without a code change. The nested attributes are
 * UNSIGNED, so they are spread UNDER `source` — a signed top-level claim keeps precedence over an
 * attributes-level value. Shared by the sign-in response handler ({@link handleOIDCResponse}) and the
 * session-refresh path ({@link revalidateOIDC}) so BOTH see the same claim surface; without this, an
 * `attributesKey` provider's A09 claim mapping would resolve at sign-in but silently not on refresh.
 */
export const liftNestedClaims = (source: Record<string, unknown>, attributesKey: string | undefined): Record<string, unknown> => {
	if (!attributesKey) {
		return source
	}
	const nested = Object.prototype.hasOwnProperty.call(source, attributesKey) ? source[attributesKey] : undefined
	if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
		return { ...nested, ...source }
	}
	return source
}

type NormalizedClaims = Record<string, unknown> & {
	externalIdentifier: string
	email: string | undefined
	name: string | undefined
	emailVerified: boolean
}

/**
 * Build the normalized claim surface shared by sign-in ({@link handleOIDCResponse}) and session refresh
 * ({@link revalidateOIDC}): lift any configured nested attributes object to the top level, then layer the
 * mapped identity fields (`externalIdentifier` / `email` / `name` / `emailVerified`) over the raw claims.
 * BOTH paths run this SAME normalization so an A09 claim-mapping rule resolves identically whether it
 * targets a raw provider claim or one of the normalized identity fields — without it the two surfaces
 * diverged (refresh saw the raw claim, sign-in the mapped value).
 *
 * `subFallback` is the signature-verified ID-token `sub`, used when a custom `externalIdentifier` mapping
 * resolves to nothing: at sign-in it is guaranteed present; on refresh it is the refreshed id-token's `sub`
 * (or, for the userinfo method, the userinfo `sub`). Throws (account-takeover guard) when the mapped
 * subject is a non-scalar or resolves empty — the refresh caller catches this and skips the sync.
 */
const normalizeClaims = (
	rawSource: Record<string, unknown>,
	claimMapping: OIDCClaimMapping | undefined,
	subFallback: string | undefined,
): NormalizedClaims => {
	const source = liftNestedClaims(rawSource, claimMapping?.attributesKey)

	// The OIDC `email_verified` claim is a boolean per spec, but some providers send the
	// string "true". userInfo (and any unwrapped attributes) take precedence over the ID token.
	const rawEmailVerified = source.email_verified
	const emailVerified = rawEmailVerified === true || rawEmailVerified === 'true'

	// `externalIdentifier` is the federation key persisted in `person_identity_provider` and
	// matched on the next sign-in, so it must be a stable scalar. A `claimMapping` that pointed
	// it at an object/array would otherwise be coerced by `String(...)` to `'[object Object]'` /
	// a comma-join — collapsing every user of the provider onto one key (account takeover). Fail
	// closed instead. The default `sub` path is safe (openid-client guarantees `sub` is a string).
	const mappedSubject = getClaim(source, claimMapping?.externalIdentifier ?? 'sub')
	let externalIdentifier: string
	if (mappedSubject === undefined || mappedSubject === null) {
		externalIdentifier = subFallback ?? ''
	} else if (typeof mappedSubject === 'string' || typeof mappedSubject === 'number') {
		externalIdentifier = String(mappedSubject)
	} else {
		throw new IDPValidationError(`The mapped externalIdentifier claim is not a scalar value`)
	}
	if (externalIdentifier === '') {
		throw new IDPValidationError(`The mapped externalIdentifier claim resolved to an empty value`)
	}

	// `email` / `name` are typed `string | undefined` on IDPResponse and feed the by-e-mail
	// account lookup (which crashes on a non-string). `...source` already placed the raw claim
	// of whatever type, so OVERWRITE (don't conditionally add) with the mapped value when it is
	// a string, otherwise `undefined` — a non-string claim must not leak through `...source`.
	const email = getClaim(source, claimMapping?.email ?? 'email')
	const name = resolveName(source, claimMapping)

	return {
		...source,
		externalIdentifier,
		email: typeof email === 'string' ? email : undefined,
		name,
		emailVerified,
	}
}

/**
 * Resolve the display name, falling back to `given_name` + `family_name` when there is no usable
 * `name` claim.
 *
 * `name` is optional in OIDC core and plenty of providers omit it while sending the parts — Apereo
 * CAS and Entra ID do, and so does Keycloak under its default mappers. Without the fallback,
 * `CreatePersonCommand` lands on its own last-resort default and a federated person ends up named
 * after the local part of their e-mail (`jan.novak`) despite the IdP having reported "Jan Novák".
 * A single-path `claimMapping.name` cannot express this: the value has to be composed from two
 * claims, not selected from one.
 *
 * An explicitly configured `claimMapping.name` is honoured as-is, fallback included — mapping a
 * claim is a statement about where the name lives, and quietly substituting a different source
 * would defeat it. A blank claim counts as absent: an empty string is not a display name, and
 * treating it as one would keep the fallback (and `CreatePersonCommand`'s) from ever running.
 */
const resolveName = (source: Record<string, unknown>, claimMapping: OIDCClaimMapping | undefined): string | undefined => {
	const mapped = getClaim(source, claimMapping?.name ?? 'name')
	if (typeof mapped === 'string' && mapped.trim() !== '') {
		return mapped
	}
	if (claimMapping?.name !== undefined) {
		return undefined
	}
	const parts = [getClaim(source, 'given_name'), getClaim(source, 'family_name')]
		.filter((part): part is string => typeof part === 'string' && part.trim() !== '')
		.map(part => part.trim())
	return parts.length > 0 ? parts.join(' ') : undefined
}

/**
 * The ID-token claims (minus the hash and nonce checks already done) merged with userInfo (userInfo wins, per spec),
 * then normalized (nested attributes lifted, identity fields mapped). Session refresh builds the same surface, so a
 * claim mapping resolves identically at sign-in and on refresh. The `sub` fallback is safe: openid-client guarantees
 * a string `sub` in a validated ID token.
 */
export const buildSignInClaims = (
	idTokenClaims: { readonly sub: string } & Record<string, unknown>,
	userInfo: Record<string, unknown>,
	claimMapping: OIDCClaimMapping | undefined,
): NormalizedClaims => {
	const { at_hash, c_hash, nonce, ...claimsWithoutHashes } = idTokenClaims
	return normalizeClaims({ ...claimsWithoutHashes, ...userInfo }, claimMapping, idTokenClaims.sub)
}

/** Parameter of an authorization response that each part of a `response_type` puts there. */
const RESPONSE_TYPE_PARAMETERS: Record<string, string> = { code: 'code', id_token: 'id_token', token: 'access_token' }

const assertResponseType = (params: Record<string, string>, expectedResponseType: string): void => {
	const expected = new Set(expectedResponseType.split(' ').map(part => RESPONSE_TYPE_PARAMETERS[part]).filter(it => it !== undefined))
	const unexpected = ['id_token', 'access_token', 'code'].filter(param => !expected.has(param) && params[param] !== undefined)
	if (unexpected.length > 0) {
		throw new IDPValidationError(`${unexpected.join(', ')} not expected for response type "${expectedResponseType}"`)
	}
	const missing = [...expected].filter(param => params[param] === undefined)
	if (missing.length > 0) {
		throw new IDPValidationError(`${missing.join(', ')} missing from the response for response type "${expectedResponseType}"`)
	}
}

/** The flow the parameters themselves call for; without `strictResponseType` this, not the configuration, decides. */
const flowOfParameters = (params: Record<string, string>): OIDCFlow => {
	if (params.code !== undefined) {
		return params.id_token !== undefined ? 'hybrid' : 'code'
	}
	return params.id_token !== undefined ? 'implicit' : 'code'
}

const hashAlgorithmOf = (jwsAlg: string): string => {
	if (jwsAlg === 'EdDSA' || jwsAlg === 'Ed25519') {
		return 'sha512'
	}
	switch (jwsAlg.slice(-3)) {
		case '256':
			return 'sha256'
		case '384':
			return 'sha384'
		case '512':
			return 'sha512'
	}
	throw new IDPValidationError(`unsupported ID token algorithm ${jwsAlg}`)
}

/**
 * Binds an access token from the authorization response to the ID token beside it (OIDC Core 3.2.2.9). openid-client 6
 * does not support response types that return an access token there, so it checks the ID token but not this hash.
 */
const assertAccessTokenHash = (idToken: string, accessToken: string): void => {
	const { alg } = decodeProtectedHeader(idToken)
	const { at_hash } = decodeJwt(idToken)
	if (typeof at_hash !== 'string') {
		throw new IDPValidationError('missing required property at_hash')
	}
	const digest = createHash(hashAlgorithmOf(alg ?? '')).update(accessToken).digest()
	if (digest.subarray(0, digest.length / 2).toString('base64url') !== at_hash) {
		throw new IDPValidationError('at_hash mismatch')
	}
}

/** openid-client 6 checks `azp` only when `aud` has several values; v5 also refused a single-audience token for another party. */
const assertAuthorizedParty = (claims: IDToken, clientId: string, additionalAuthorizedParties: readonly string[]): void => {
	if (claims.azp !== undefined && claims.azp !== clientId && !additionalAuthorizedParties.includes(claims.azp)) {
		throw new IDPValidationError(`azp mismatch, got: ${claims.azp}`)
	}
}

const describeError = (error: string, description: string | undefined): string => description ? `${error} (${description})` : error

/** The error an IdP put in a failed response's JSON body: an OAuth `error`, or a non-standard `{ "error": { "message" } }`. */
const errorInBody = async (response: Response): Promise<string | undefined> => {
	try {
		const body: unknown = await response.clone().json()
		if (typeof body === 'object' && body !== null && 'error' in body) {
			const error: unknown = body.error
			if (typeof error === 'string') {
				const description = 'error_description' in body && typeof body.error_description === 'string' ? body.error_description : undefined
				return describeError(error, description)
			}
			if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
				return error.message
			}
		}
	} catch {
		// not JSON
	}
	return undefined
}

const challengeError = (e: WWWAuthenticateChallengeError): string | undefined => e.cause.map(it => it.parameters.error).find(it => it !== undefined)

/**
 * openid-client wraps a failure it does not recognize, such as a refused or broken connection or an egress-guard
 * refusal, in a `ClientError` without a code. Unwrap it, so it reaches the caller as before: a transient failure.
 */
export const unwrapForeignError = (
	e: unknown,
): unknown => (e instanceof ClientError && e.code === undefined && e.cause instanceof Error ? e.cause : e)

/** The sign-in error for a failure of openid-client: what the IdP answered, or what failed validation here. */
const toSignInError = async (e: unknown): Promise<unknown> => {
	if (e instanceof AuthorizationResponseError || e instanceof ResponseBodyError) {
		return new IDPResponseError(describeError(e.error, e.error_description))
	}
	if (e instanceof WWWAuthenticateChallengeError) {
		return new IDPResponseError(challengeError(e) ?? (await errorInBody(e.response)) ?? `${e.message}: ${e.status}`)
	}
	if (e instanceof ClientError && e.code !== undefined) {
		// an unexpected status or content type: openid-client passes the IdP's response as the cause
		if (e.cause instanceof Response) {
			return new IDPResponseError((await errorInBody(e.cause)) ?? `${e.message}: ${e.cause.status}`)
		}
		const detail = e.cause instanceof Error && e.cause.message !== e.message ? `: ${e.cause.message}` : ''
		return new IDPValidationError(`${e.message}${detail}`)
	}
	return unwrapForeignError(e)
}

/** The redirect back to the client, rebuilt from its parameters: query for the code flow, fragment otherwise. */
const callbackUrl = (redirectUrl: string, params: Record<string, string>, flow: OIDCFlow): URL => {
	const url = new URL(redirectUrl)
	if (flow === 'code') {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, value)
		}
	} else {
		url.hash = new URLSearchParams(params).toString()
	}
	return url
}

const completeAuthorization = async (
	client: Configuration,
	flow: OIDCFlow,
	params: Record<string, string>,
	{ redirectUrl, nonce, state }: { redirectUrl: string | undefined; nonce: string | undefined; state: string | undefined },
): Promise<{ claims: IDToken; tokens: OIDCTokenSet }> => {
	if (flow !== 'code' && nonce === undefined) {
		throw new IDPValidationError('nonce is missing in session data')
	}
	if (flow === 'implicit') {
		// only the fragment is read; an implicit response needs no redirect URL
		const claims = await implicitAuthentication(client, callbackUrl(redirectUrl ?? 'about:blank', params, flow), nonce ?? '', { expectedState: state })
		if (params.access_token !== undefined) {
			assertAccessTokenHash(params.id_token, params.access_token)
		}
		return { claims, tokens: tokenSetOfParameters(params) }
	}
	if (redirectUrl === undefined) {
		throw new IDPValidationError('redirectUrl is required to exchange the authorization code')
	}
	const response = await authorizationCodeGrant(client, callbackUrl(redirectUrl, params, flow), {
		expectedNonce: nonce,
		expectedState: state,
		idTokenExpected: true,
	})
	if (flow === 'hybrid' && params.access_token !== undefined) {
		assertAccessTokenHash(params.id_token, params.access_token)
	}
	const claims = response.claims()
	if (!claims) {
		throw new IDPValidationError('id_token not present in the token response')
	}
	return { claims, tokens: tokenSetOf(response) }
}

/**
 * Validate an authorization response and turn it into the normalized {@link IDPResponse}. `clientFor` gives the
 * openid-client configuration of a flow: the parameters decide the flow, and with `expectedResponseType` set they must
 * match it exactly first.
 */
export const handleOIDCResponse = async (
	clientFor: (flow: OIDCFlow) => Promise<Configuration>,
	{ sessionData, redirectUrl, ...otherData }: OIDCResponseData,
	{ expectedResponseType, fetchUserInfo: withUserInfo, returnOIDCResult, captureSession, claimMapping, additionalAuthorizedParties = [] }:
		HandleOIDCResponseOptions = {},
): Promise<IDPResponse> => {
	const params = 'parameters' in otherData ? otherData.parameters : Object.fromEntries(new URL(otherData.url).searchParams)
	if (params.state && !sessionData?.state) {
		throw new IDPValidationError(`state is present in parameters, but missing in session data`)
	}
	if (expectedResponseType !== undefined) {
		assertResponseType(params, expectedResponseType)
	}
	const flow = flowOfParameters(params)
	const client = await clientFor(flow)
	try {
		const { claims, tokens } = await completeAuthorization(client, flow, params, { redirectUrl, nonce: sessionData?.nonce, state: sessionData?.state })
		assertAuthorizedParty(claims, client.clientMetadata().client_id, additionalAuthorizedParties)
		const userInfo = tokens.access_token && withUserInfo ? await fetchUserInfo(client, tokens.access_token, claims.sub) : {}
		const idpSession = captureSession ? tokenSetToSessionState(tokens, typeof claims.sid === 'string' ? claims.sid : undefined) : undefined

		return {
			...(returnOIDCResult ? tokens : {}),
			...buildSignInClaims(claims, userInfo, claimMapping),
			...(idpSession ? { idpSession } : {}),
		}
	} catch (e) {
		if (e instanceof IDPValidationError) {
			throw e
		}
		throw await toSignInError(e)
	}
}

/** OIDC errors that definitively mean "this session is no longer valid at the IdP". */
const REVOKED_OIDC_ERRORS = new Set(['invalid_grant', 'invalid_token', 'expired_token'])

/**
 * Whether a failed probe means the IdP no longer accepts the session. Only the token endpoint and userinfo answer
 * that way: introspection reports a dead token as 200 `{ active: false }` (RFC 7662 §2.2), so any error it returns is
 * about the request or the client's own credentials (§2.3) — transient, it must not log users out.
 */
const revokedBy = (method: 'refresh' | 'userinfo' | 'introspection', e: unknown): RevalidationResult | undefined => {
	if (method === 'introspection') {
		return undefined
	}
	if (e instanceof ResponseBodyError && REVOKED_OIDC_ERRORS.has(e.error)) {
		return { status: 'revoked', reason: e.error }
	}
	if (method !== 'userinfo') {
		return undefined
	}
	if (e instanceof WWWAuthenticateChallengeError) {
		const error = challengeError(e)
		if (error !== undefined && REVOKED_OIDC_ERRORS.has(error)) {
			return { status: 'revoked', reason: error }
		}
	}
	// The userinfo endpoint signals a rejected access token with a bare HTTP 401 — per RFC 6750 the
	// `WWW-Authenticate` error code is optional. A 401 is still definitive: the token is no longer accepted.
	const status = e instanceof WWWAuthenticateChallengeError
		? e.status
		: e instanceof ClientError && e.cause instanceof Response
		? e.cause.status
		: undefined
	return status === 401 ? { status: 'revoked', reason: 'userinfo_unauthorized' } : undefined
}

/**
 * Re-validate a stored OIDC session against the IdP. Returns `revoked` only for definitive
 * IdP responses (invalid/expired grant or inactive introspection). Transient failures
 * (network, IdP down) re-throw so the caller can fail-open and keep the session — IdP
 * downtime must not log everyone out.
 */
export const revalidateOIDC = async (
	client: Configuration,
	method: 'refresh' | 'userinfo' | 'introspection',
	session: IDPSessionState,
	options: { claimMapping?: OIDCClaimMapping; fetchUserInfo?: boolean } = {},
): Promise<RevalidationResult> => {
	const { claimMapping, fetchUserInfo: withUserInfo } = options
	const tokens = session.tokens ?? {}
	const refreshToken = typeof tokens.refresh_token === 'string' ? tokens.refresh_token : undefined
	const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token : undefined
	try {
		if (method === 'refresh') {
			if (!refreshToken) {
				return { status: 'revoked', reason: 'no_refresh_token' }
			}
			const response = await refreshTokenGrant(client, refreshToken)
			let claims: Record<string, unknown> | undefined
			let claimsComplete = false
			try {
				// Reconstruct the SAME claim surface sign-in builds (handleOIDCResponse): the refreshed id-token
				// claims merged with userInfo when `fetchUserInfo` is set — exactly as at sign-in — then the shared
				// normalization (lift nested attributes + map identity fields). An `always` mapping therefore
				// reconciles against an identical surface on refresh, so `claimsComplete` lets the caller enable
				// `unmatched: "remove"` reconciliation here too (see IdpSessionRevalidator).
				const idClaims = response.claims()
				if (idClaims) {
					const userInfo = response.access_token && withUserInfo ? await fetchUserInfo(client, response.access_token, idClaims.sub) : {}
					claims = normalizeClaims({ ...idClaims, ...userInfo }, claimMapping, idClaims.sub)
					claimsComplete = true
				}
			} catch {
				// Building the surface failed (userinfo unreachable, a non-scalar `externalIdentifier`, …). The IdP
				// already vouched for the session via the successful refresh, so KEEP it — just skip the claim sync
				// this tick (no claims → no grant, no removal) and retry on a later refresh. Leaving claimsComplete
				// false also guarantees a half-built surface can never drive a removal.
				claims = undefined
				claimsComplete = false
			}
			return {
				status: 'valid',
				claims,
				claimsComplete,
				// carry the stored tokens forward: a non-rotating IdP omits the refresh token here
				idpSession: tokenSetToSessionState(tokenSetOf(response), session.sessionId, tokens),
			}
		}
		if (method === 'userinfo') {
			if (!accessToken) {
				return { status: 'revoked', reason: 'no_access_token' }
			}
			const userInfo = await fetchUserInfo(client, accessToken, skipSubjectCheck)
			let claims: Record<string, unknown> | undefined
			try {
				claims = normalizeClaims(userInfo, claimMapping, userInfo.sub)
			} catch {
				claims = undefined
			}
			// A userinfo probe carries no id-token claims, so its surface is NARROWER than sign-in's (id-token +
			// userinfo): a rule keyed on an id-token-only claim would miss here. Keep refresh-time sync additive-only
			// (`claimsComplete: false`) so `unmatched: "remove"` never strips a membership off this partial surface.
			return { status: 'valid', claims, claimsComplete: false }
		}
		// introspection
		const token = accessToken ?? refreshToken
		if (!token) {
			return { status: 'revoked', reason: 'no_token' }
		}
		const result = await tokenIntrospection(client, token, { token_type_hint: accessToken ? 'access_token' : 'refresh_token' })
		if (!result.active) {
			return { status: 'revoked', reason: 'inactive' }
		}
		return { status: 'valid' }
	} catch (e) {
		const revoked = revokedBy(method, e)
		if (revoked) {
			return revoked
		}
		// transient (network / IdP unavailable) — propagate, do not revoke
		throw unwrapForeignError(e)
	}
}

/**
 * Build an RP-initiated (front-channel) logout URL (OIDC RP-Initiated Logout 1.0). Returns null
 * when the IdP advertises no `end_session_endpoint` — the caller then degrades to a local-only
 * logout (legacy-IdP graceful fallback). The `id_token_hint` lets the IdP identify and confirm the
 * session to terminate; `post_logout_redirect_uri` is where the IdP returns the browser afterwards.
 */
export const buildOIDCLogoutUrl = (client: Configuration, { idToken, postLogoutRedirectUri }: LogoutUrlRequest): string | null => {
	if (!client.serverMetadata().end_session_endpoint) {
		return null
	}
	return buildEndSessionUrl(client, {
		...(idToken ? { id_token_hint: idToken } : {}),
		...(postLogoutRedirectUri ? { post_logout_redirect_uri: postLogoutRedirectUri } : {}),
	}).href
}

/**
 * The OIDC Back-Channel Logout 1.0 event member that MUST be present in a logout token's `events`
 * claim. Its presence (and the absence of a `nonce`) is what distinguishes a logout token from an
 * ID token — both are signed by the same IdP, so without this check an ID token could be replayed
 * to forcibly log a user out.
 */
const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout'

/**
 * Max accepted age of a back-channel logout token, derived from its `iat`. OIDC Back-Channel Logout
 * tokens are single-use and short-lived; bounding the age (together with requiring `exp`) limits the
 * window in which a captured token could be replayed to force a logout.
 */
const LOGOUT_TOKEN_MAX_AGE_SECONDS = 120
const LOGOUT_TOKEN_CLOCK_TOLERANCE_SECONDS = 5

export type RemoteJwksResolver = (jwksUri: string) => ReturnType<typeof createRemoteJWKSet>

/**
 * Remote JWKS sets keyed by `jwks_uri`. `createRemoteJWKSet` returns a function with its own internal
 * key cache + fetch cooldown, so it MUST be reused across requests — re-creating it per call (as the
 * unauthenticated back-channel endpoint would otherwise do) defeats the cache and turns every request
 * into a potential outbound JWKS fetch. Keyed by URL, so two providers sharing an IdP share the set.
 */
export const createRemoteJwksResolver = (fetchImpl: FetchImplementation | undefined): RemoteJwksResolver => {
	const cache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()
	return jwksUri => {
		let jwks = cache.get(jwksUri)
		if (!jwks) {
			jwks = createRemoteJWKSet(new URL(jwksUri), fetchImpl ? { [customFetch]: fetchImpl } : undefined)
			cache.set(jwksUri, jwks)
		}
		return jwks
	}
}

/**
 * Validate an OIDC back-channel logout token (OIDC Back-Channel Logout 1.0 §2.4–2.6) and extract
 * the targeted `sid` / `sub`. The token is a JWT signed by the IdP; we verify the signature against
 * the issuer's JWKS and enforce the issuer + audience (client_id) the same way ID tokens are
 * verified, pinning the signing algorithm to the provider's configured one, then assert the
 * back-channel-specific claims:
 *   - `iat` is present and recent and `exp` is present (§2.4 requires both) — bounds the replay window;
 *   - `events` contains the back-channel-logout member (it really is a logout token);
 *   - it carries a `sid` and/or `sub` (otherwise there is nothing to act on);
 *   - it does NOT carry a `nonce` (a `nonce` means it is an ID token being replayed).
 * Throws {@link IDPValidationError} on any failure so the caller can answer 400.
 */
export const validateOIDCLogoutToken = async (
	client: Configuration,
	logoutToken: string,
	resolveJwks: RemoteJwksResolver,
): Promise<LogoutTokenClaims> => {
	const server = client.serverMetadata()
	const metadata = client.clientMetadata()
	const jwksUri = server.jwks_uri
	if (!jwksUri) {
		throw new IDPValidationError('IdP has no jwks_uri; cannot verify logout token')
	}
	const clientId = metadata.client_id
	if (typeof clientId !== 'string' || clientId === '') {
		// The `aud` check is a core anti-token-substitution defence on this unauthenticated endpoint.
		// jose treats `audience: undefined` as "skip the aud check entirely", so a missing client_id
		// must fail closed (reject the token) rather than fall through and accept any audience.
		throw new IDPValidationError('cannot verify logout token audience: client_id is missing')
	}
	const expectedAlg = metadata.id_token_signed_response_alg ?? 'RS256'
	const jwks = resolveJwks(jwksUri)
	let payload: Record<string, unknown>
	try {
		const verified = await jwtVerify(logoutToken, jwks, {
			issuer: server.issuer,
			audience: clientId,
			// pin to the provider's configured signing alg so a JWKS containing a symmetric/none key
			// can never be selected (defence-in-depth on top of jose's own key-type check).
			algorithms: [expectedAlg],
			// §2.4: `iat` and `exp` are REQUIRED. `maxTokenAge` makes `iat` required + bounds freshness;
			// `requiredClaims` makes `exp` required (jose only checks `exp` when present).
			maxTokenAge: LOGOUT_TOKEN_MAX_AGE_SECONDS,
			requiredClaims: ['exp'],
			clockTolerance: LOGOUT_TOKEN_CLOCK_TOLERANCE_SECONDS,
		})
		payload = verified.payload as Record<string, unknown>
	} catch (e: any) {
		throw new IDPValidationError(`Invalid logout token: ${e?.message ?? 'verification failed'}`)
	}

	// A logout token MUST NOT contain a nonce; its presence means an ID token is being replayed.
	if ('nonce' in payload) {
		throw new IDPValidationError('Logout token must not contain a nonce')
	}

	const events = payload.events
	const hasLogoutEvent = typeof events === 'object' && events !== null && BACKCHANNEL_LOGOUT_EVENT in (events as Record<string, unknown>)
	if (!hasLogoutEvent) {
		throw new IDPValidationError('Logout token is missing the back-channel-logout event')
	}

	const sid = typeof payload.sid === 'string' ? payload.sid : undefined
	const sub = typeof payload.sub === 'string' ? payload.sub : undefined
	if (!sid && !sub) {
		throw new IDPValidationError('Logout token must contain a sid or sub claim')
	}

	return { sid, sub }
}
