import { Client, custom, errors, generators, TokenSet } from 'openid-client'
import { OIDCClaimMapping, OIDCResponseData } from './OIDCTypes.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { IDPResponseError } from '../IDPResponseError.js'
import { IDPResponse, IDPSessionState, InitIDPAuthResult, RevalidationResult } from '../IdentityProviderHandler.js'

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
