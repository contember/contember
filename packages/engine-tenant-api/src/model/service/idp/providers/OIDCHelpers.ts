import { Client, custom, errors, generators, Issuer, TokenSet } from 'openid-client'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { OIDCClaimMapping, OIDCResponseData } from './OIDCTypes.js'
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
export const tokenSetToSessionState = (tokenSet: TokenSet, sessionId?: string, prevTokens?: Record<string, unknown>): IDPSessionState => {
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

export const initOIDCAuth = async (
	client: Client,
	{ redirectUrl, scope, responseMode }: { redirectUrl: string; scope?: string; responseMode?: string },
): Promise<InitIDPAuthResult> => {
	const nonce = generators.nonce()
	const state = generators.state()
	const url = client.authorizationUrl({
		redirect_uri: redirectUrl,
		response_mode: responseMode,
		scope: scope ?? 'openid email',
		nonce,
		state,
	})

	return {
		authUrl: url,
		sessionData: { nonce, state },
	}
}

export type HandleOIDCResponseOptions = {
	fetchUserInfo?: boolean
	returnOIDCResult?: boolean
	captureSession?: boolean
	claimMapping?: OIDCClaimMapping
}

/** Read a claim by name, supporting dot-paths into nested objects (`a.b.c`). */
const getClaim = (source: Record<string, unknown>, path: string): unknown =>
	path.split('.').reduce<unknown>(
		(acc, key) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
		source,
	)

export const handleOIDCResponse = async (
	client: Client,
	{ sessionData, redirectUrl, ...otherData }: OIDCResponseData,
	{ fetchUserInfo, returnOIDCResult, captureSession, claimMapping }: HandleOIDCResponseOptions = {},
): Promise<IDPResponse> => {
	const params = 'parameters' in otherData ? otherData.parameters : client.callbackParams(otherData.url)
	if (params.state && !sessionData?.state) {
		throw new IDPValidationError(`state is present in parameters, but missing in session data`)
	}
	try {
		const result = await client.callback(redirectUrl, params, sessionData)
		const claims = result.claims()
		const { at_hash, c_hash, nonce, ...claimsWithoutHashes } = claims
		const userInfo = result.access_token && fetchUserInfo ? await client.userinfo(result) : {}
		const oidcResult = returnOIDCResult ? result : {}
		const idpSession = captureSession ? tokenSetToSessionState(result, typeof claims.sid === 'string' ? claims.sid : undefined) : undefined

		// Merge ID-token claims with userInfo (userInfo wins, per spec). Then optionally lift a
		// nested attributes object to the top level so providers that nest their claims (notably
		// Apereo CAS userinfo, which returns them under `attributes`) map without a code change.
		// The nested attributes are UNSIGNED, so they must not override a claim already present in
		// the (signature-verified) ID-token / userInfo merge — spread them UNDER `source`, not over
		// it, so a signed `sub` / `email_verified` keeps precedence over an attributes-level value.
		let source: Record<string, unknown> = { ...claimsWithoutHashes, ...userInfo }
		const attributesKey = claimMapping?.attributesKey
		if (attributesKey) {
			const nested = source[attributesKey]
			if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
				source = { ...(nested as Record<string, unknown>), ...source }
			}
		}

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
			externalIdentifier = claims.sub
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
		const name = getClaim(source, claimMapping?.name ?? 'name')

		return {
			...oidcResult,
			...source,
			externalIdentifier,
			email: typeof email === 'string' ? email : undefined,
			name: typeof name === 'string' ? name : undefined,
			emailVerified,
			...(idpSession ? { idpSession } : {}),
		}
	} catch (e: any) {
		if (e instanceof errors.RPError) {
			throw new IDPValidationError(e.message)
		}
		if (e instanceof errors.OPError) {
			const body = e.response?.body as any
			if (typeof body === 'object' && typeof body?.error === 'object' && typeof body.error?.message === 'string') {
				throw new IDPResponseError(body.error.message)
			}
			throw new IDPResponseError(e.message)
		}
		throw e
	}
}

/** OIDC errors that definitively mean "this session is no longer valid at the IdP". */
const REVOKED_OIDC_ERRORS = new Set(['invalid_grant', 'invalid_token', 'expired_token'])

/**
 * Re-validate a stored OIDC session against the IdP. Returns `revoked` only for definitive
 * IdP responses (invalid/expired grant or inactive introspection). Transient failures
 * (network, IdP down) re-throw so the caller can fail-open and keep the session — IdP
 * downtime must not log everyone out.
 */
export const revalidateOIDC = async (
	client: Client,
	method: 'refresh' | 'userinfo' | 'introspection',
	session: IDPSessionState,
): Promise<RevalidationResult> => {
	const tokens = session.tokens ?? {}
	const refreshToken = typeof tokens.refresh_token === 'string' ? tokens.refresh_token : undefined
	const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token : undefined
	try {
		if (method === 'refresh') {
			if (!refreshToken) {
				return { status: 'revoked', reason: 'no_refresh_token' }
			}
			const tokenSet = await client.refresh(refreshToken)
			let claims: Record<string, unknown> | undefined
			try {
				claims = tokenSet.id_token ? tokenSet.claims() : undefined
			} catch {
				claims = undefined
			}
			return {
				status: 'valid',
				claims,
				// carry the stored tokens forward: a non-rotating IdP omits the refresh token here
				idpSession: tokenSetToSessionState(tokenSet, session.sessionId, tokens),
			}
		}
		if (method === 'userinfo') {
			if (!accessToken) {
				return { status: 'revoked', reason: 'no_access_token' }
			}
			const userInfo = await client.userinfo(accessToken)
			return { status: 'valid', claims: userInfo }
		}
		// introspection
		const token = accessToken ?? refreshToken
		if (!token) {
			return { status: 'revoked', reason: 'no_token' }
		}
		const result = await client.introspect(token, accessToken ? 'access_token' : 'refresh_token')
		if (!result.active) {
			return { status: 'revoked', reason: 'inactive' }
		}
		return { status: 'valid' }
	} catch (e: any) {
		if (e instanceof errors.OPError) {
			if (typeof e.error === 'string' && REVOKED_OIDC_ERRORS.has(e.error)) {
				return { status: 'revoked', reason: e.error }
			}
			// The userinfo endpoint signals a rejected access token with a bare HTTP 401 — per
			// RFC 6750 the `WWW-Authenticate` error code is optional, so openid-client may not
			// surface a parseable `error` here. A 401 is still definitive: the token is no
			// longer accepted → revoked. (Introspection is NOT treated this way: it returns 200
			// `{active:false}` for revoked tokens, so a 401/400 there means client-auth/config
			// failure — transient, must not log users out.)
			if (method === 'userinfo' && e.response?.statusCode === 401) {
				return { status: 'revoked', reason: 'userinfo_unauthorized' }
			}
		}
		// transient (network / IdP unavailable) — propagate, do not revoke
		throw e
	}
}

/**
 * Build an RP-initiated (front-channel) logout URL (OIDC RP-Initiated Logout 1.0). Returns null
 * when the IdP advertises no `end_session_endpoint` — the caller then degrades to a local-only
 * logout (legacy-IdP graceful fallback). The `id_token_hint` lets the IdP identify and confirm the
 * session to terminate; `post_logout_redirect_uri` is where the IdP returns the browser afterwards.
 */
export const buildOIDCLogoutUrl = (client: Client, { idToken, postLogoutRedirectUri }: LogoutUrlRequest): string | null => {
	if (!client.issuer.metadata.end_session_endpoint) {
		return null
	}
	return client.endSessionUrl({
		...(idToken ? { id_token_hint: idToken } : {}),
		...(postLogoutRedirectUri ? { post_logout_redirect_uri: postLogoutRedirectUri } : {}),
	})
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

/**
 * Remote JWKS sets keyed by `jwks_uri`. `createRemoteJWKSet` returns a function with its own internal
 * key cache + fetch cooldown, so it MUST be reused across requests — re-creating it per call (as the
 * unauthenticated back-channel endpoint would otherwise do) defeats the cache and turns every request
 * into a potential outbound JWKS fetch. Keyed by URL, so two providers sharing an IdP share the set.
 */
const remoteJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

const getRemoteJwks = (jwksUri: string): ReturnType<typeof createRemoteJWKSet> => {
	let jwks = remoteJwksCache.get(jwksUri)
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL(jwksUri))
		remoteJwksCache.set(jwksUri, jwks)
	}
	return jwks
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
export const validateOIDCLogoutToken = async (client: Client, issuer: Issuer<Client>, logoutToken: string): Promise<LogoutTokenClaims> => {
	const jwksUri = issuer.metadata.jwks_uri
	if (!jwksUri) {
		throw new IDPValidationError('IdP has no jwks_uri; cannot verify logout token')
	}
	const clientId = client.metadata.client_id
	if (typeof clientId !== 'string' || clientId === '') {
		// The `aud` check is a core anti-token-substitution defence on this unauthenticated endpoint.
		// jose treats `audience: undefined` as "skip the aud check entirely", so a missing client_id
		// must fail closed (reject the token) rather than fall through and accept any audience.
		throw new IDPValidationError('cannot verify logout token audience: client_id is missing')
	}
	const expectedAlg = typeof client.metadata.id_token_signed_response_alg === 'string'
		? client.metadata.id_token_signed_response_alg
		: 'RS256'
	const jwks = getRemoteJwks(jwksUri)
	let payload: Record<string, unknown>
	try {
		const verified = await jwtVerify(logoutToken, jwks, {
			issuer: issuer.metadata.issuer,
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
