import { Client, custom, errors, generators, TokenSet } from 'openid-client'
import { OIDCResponseData } from './OIDCTypes'
import { IDPValidationError } from '../IDPValidationError'
import { IDPResponseError } from '../IDPResponseError'
import { IDPResponse, IDPSessionState, InitIDPAuthResult, RevalidationResult } from '../IdentityProviderHandler'

/**
 * Build the persisted session state from an OIDC token set. Stores the tokens needed for
 * later re-validation (refresh/access) and SLO (id_token); the whole `tokens` blob is
 * encrypted at rest by the command layer.
 */
export const tokenSetToSessionState = (tokenSet: TokenSet, sessionId?: string): IDPSessionState => ({
	sessionId,
	tokens: {
		...(tokenSet.refresh_token ? { refresh_token: tokenSet.refresh_token } : {}),
		...(tokenSet.access_token ? { access_token: tokenSet.access_token } : {}),
		...(tokenSet.id_token ? { id_token: tokenSet.id_token } : {}),
	},
	expiresAt: tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) : undefined,
})

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

export const handleOIDCResponse = async (
	client: Client,
	{ sessionData, redirectUrl, ...otherData }: OIDCResponseData,
	fetchUserInfo?: boolean,
	returnOIDCResult?: boolean,
	captureSession?: boolean,
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

		return {
			externalIdentifier: claims.sub,
			...oidcResult,
			...claimsWithoutHashes,
			...userInfo,
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
				idpSession: tokenSetToSessionState(tokenSet, session.sessionId),
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
