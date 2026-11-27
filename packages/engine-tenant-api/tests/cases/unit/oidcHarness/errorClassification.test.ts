import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { decodeJwt } from 'jose'
import { ClientError, ResponseBodyError, WWWAuthenticateChallengeError } from 'openid-client'
import { IDPSessionState } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { IDPResponseError } from '../../../../src/model/service/idp/IDPResponseError.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpOverride } from './FakeIdp.js'
import { configurationFor, REDIRECT_URL, sessionDataOf, signer, signIn, startSignIn, useRuntimeGlobals } from './harness.js'

/**
 * Which IdP failures revoke a session and which propagate as transient (IdP downtime must not log everyone out).
 * The openid-client error classes are named on purpose: `revalidateOIDC` and `handleOIDCResponse` branch on them.
 */

/** How a transient failure reaches the caller: the openid-client error class and what identifies the failure. */
type Thrown = readonly [typeof ClientError | typeof ResponseBodyError | typeof WWWAuthenticateChallengeError, Record<string, unknown>]

const notConform = (status: number): Thrown => [ClientError, { code: 'OAUTH_RESPONSE_IS_NOT_CONFORM', cause: expect.objectContaining({ status }) }]
const bodyError = (error: string): Thrown => [ResponseBodyError, { error }]
const timedOut: Thrown = [ClientError, { code: 'OAUTH_TIMEOUT' }]

const TIMEOUT_MS = 1000

const respond = (status: number, body?: string | object, headers?: Record<string, string>): FakeIdpOverride => ({
	kind: 'respond',
	status,
	body,
	headers,
})

describe('OIDC failure classification', () => {
	useRuntimeGlobals()

	let idp: FakeIdp

	beforeAll(async () => {
		idp = await FakeIdp.start()
	})
	afterAll(async () => {
		await idp.stop()
	})
	beforeEach(() => {
		idp.reset()
	})

	const configuration = (method: 'refresh' | 'userinfo' | 'introspection'): OIDCConfiguration =>
		configurationFor(idp, { timeout: TIMEOUT_MS, revalidation: { enabled: true, method } })

	/** A session captured at sign-in, then the provider that will revalidate it (discovery already cached). */
	const signedIn = async (method: 'refresh' | 'userinfo' | 'introspection'): Promise<{ provider: OIDCProvider; session: IDPSessionState }> => {
		const provider = new OIDCProvider(null, null)
		idp.alwaysIssueRefreshToken = true
		const { response } = await signIn(provider, configuration(method), idp)
		if (!response.idpSession) {
			throw new Error('expected a captured session')
		}
		return { provider, session: response.idpSession }
	}

	describe('revalidation by refresh grant', () => {
		test('a refresh token the IdP no longer knows: revoked, invalid_grant', async () => {
			const { provider, session } = await signedIn('refresh')
			idp.revokeAll()

			expect(await provider.revalidate(configuration('refresh'), session)).toEqual({ status: 'revoked', reason: 'invalid_grant' })
		})

		test.each(['invalid_grant', 'invalid_token', 'expired_token'])('400 %s: revoked with that reason', async error => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', respond(400, { error }))

			expect(await provider.revalidate(configuration('refresh'), session)).toEqual({ status: 'revoked', reason: error })
		})

		test('400 invalid_grant beside a WWW-Authenticate challenge: revoked, the error read from the body', async () => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', respond(400, { error: 'invalid_grant' }, { 'www-authenticate': 'Basic realm="idp"' }))

			expect(await provider.revalidate(configuration('refresh'), session)).toEqual({ status: 'revoked', reason: 'invalid_grant' })
		})

		test('a refreshed ID token for a party no longer authorized: thrown, session kept', async () => {
			const otherIdp = await FakeIdp.start({ idTokenClaims: { azp: 'other-party' } })
			try {
				otherIdp.alwaysIssueRefreshToken = true
				// the refused refresh still rotated the token at the IdP; the second refresh reuses the stored one
				otherIdp.rotateRefreshTokens = false
				const provider = new OIDCProvider(null, null)
				const authorized = configurationFor(otherIdp, { revalidation: { enabled: true }, additionalAuthorizedParties: ['other-party'] })
				const { response } = await signIn(provider, authorized, otherIdp)
				const session = response.idpSession ?? { tokens: {} }

				const promise = provider.revalidate({ ...authorized, additionalAuthorizedParties: [] }, session)

				await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
				await expect(promise).rejects.toThrow('azp mismatch, got: other-party')
				expect(await provider.revalidate(authorized, session)).toMatchObject({ status: 'valid' })
			} finally {
				await otherIdp.stop()
			}
		})

		test('no stored refresh token: revoked without a request', async () => {
			const { provider } = await signedIn('refresh')
			const before = idp.requests.length

			expect(await provider.revalidate(configuration('refresh'), { tokens: { access_token: 'a' } })).toEqual({
				status: 'revoked',
				reason: 'no_refresh_token',
			})
			expect(idp.requests).toHaveLength(before)
		})

		const transient: [string, FakeIdpOverride, Thrown][] = [
			['401 invalid_client', respond(401, { error: 'invalid_client' }), bodyError('invalid_client')],
			['400 unauthorized_client', respond(400, { error: 'unauthorized_client' }), bodyError('unauthorized_client')],
			['503 temporarily_unavailable', respond(503, { error: 'temporarily_unavailable' }), notConform(503)],
			// a 5xx is the IdP failing, whatever error code its body names
			['503 with an invalid_grant body', respond(503, { error: 'invalid_grant' }), notConform(503)],
			[
				'503 with error="invalid_grant" in its challenge',
				respond(503, undefined, { 'www-authenticate': 'Bearer error="invalid_grant"' }),
				[WWWAuthenticateChallengeError, { status: 503 }],
			],
			['500 with a plain-text body', respond(500, 'boom'), notConform(500)],
			['400 with a non-standard JSON error object', respond(400, { error: { message: 'bad refresh token' } }), notConform(400)],
			['200 without a body', respond(200), [ClientError, { code: 'OAUTH_INVALID_RESPONSE' }]],
		]

		test.each(transient)('%s: thrown, session kept', async (_, override, [errorClass, identity]) => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', override)

			const promise = provider.revalidate(configuration('refresh'), session)

			await expect(promise).rejects.toBeInstanceOf(errorClass)
			await expect(promise).rejects.toMatchObject(identity)
		})

		test('a token endpoint that never answers: thrown as a timeout after the configured timeout', async () => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', { kind: 'hang' })

			const promise = provider.revalidate(configuration('refresh'), session)

			await expect(promise).rejects.toBeInstanceOf(timedOut[0])
			await expect(promise).rejects.toMatchObject(timedOut[1])
		})

		test('an IdP that is down: the connection error is thrown as is', async () => {
			const downIdp = await FakeIdp.start()
			const provider = new OIDCProvider(null, null)
			const config = configurationFor(downIdp, { revalidation: { enabled: true } })
			await startSignIn(provider, config)
			await downIdp.stop()

			const promise = provider.revalidate(config, { tokens: { refresh_token: 'r' } })

			// the socket error code depends on the runtime (ECONNREFUSED, EPIPE), so only its presence is pinned
			await expect(promise).rejects.toMatchObject({ code: expect.any(String) })
			await expect(promise).rejects.not.toBeInstanceOf(ClientError)
			await expect(promise).rejects.not.toBeInstanceOf(ResponseBodyError)
		})
	})

	describe('revalidation by userinfo', () => {
		test('an access token the IdP no longer knows (401 with error="invalid_token"): revoked, invalid_token', async () => {
			const { provider, session } = await signedIn('userinfo')
			idp.revokeAll()

			expect(await provider.revalidate(configuration('userinfo'), session)).toEqual({ status: 'revoked', reason: 'invalid_token' })
		})

		test('a bare 401 without WWW-Authenticate: revoked, userinfo_unauthorized', async () => {
			const { provider, session } = await signedIn('userinfo')
			idp.override('userinfo', respond(401))

			expect(await provider.revalidate(configuration('userinfo'), session)).toEqual({ status: 'revoked', reason: 'userinfo_unauthorized' })
		})

		test.each([400, 403])('%d with an invalid_token body and no challenge: revoked, invalid_token', async status => {
			const { provider, session } = await signedIn('userinfo')
			idp.override('userinfo', respond(status, { error: 'invalid_token' }))

			expect(await provider.revalidate(configuration('userinfo'), session)).toEqual({ status: 'revoked', reason: 'invalid_token' })
		})

		test('no stored access token: revoked without a request', async () => {
			const { provider } = await signedIn('userinfo')
			const before = idp.requests.length

			expect(await provider.revalidate(configuration('userinfo'), { tokens: {} })).toEqual({ status: 'revoked', reason: 'no_access_token' })
			expect(idp.requests).toHaveLength(before)
		})

		const transient: [string, FakeIdpOverride, Thrown][] = [
			[
				'403 insufficient_scope',
				respond(403, undefined, { 'www-authenticate': 'Bearer error="insufficient_scope"' }),
				[WWWAuthenticateChallengeError, { status: 403 }],
			],
			['500', respond(500, 'boom'), notConform(500)],
			['500 with an invalid_token body', respond(500, { error: 'invalid_token' }), notConform(500)],
			[
				'503 with an invalid_token challenge body',
				respond(503, { error: 'invalid_token' }, { 'www-authenticate': 'Bearer realm="idp"' }),
				[WWWAuthenticateChallengeError, { status: 503 }],
			],
			[
				'503 with error="invalid_token" in its challenge',
				respond(503, undefined, { 'www-authenticate': 'Bearer error="invalid_token"' }),
				[WWWAuthenticateChallengeError, { status: 503 }],
			],
		]

		test.each(transient)('%s: thrown, session kept', async (_, override, [errorClass, identity]) => {
			const { provider, session } = await signedIn('userinfo')
			idp.override('userinfo', override)

			const promise = provider.revalidate(configuration('userinfo'), session)

			await expect(promise).rejects.toBeInstanceOf(errorClass)
			await expect(promise).rejects.toMatchObject(identity)
		})
	})

	describe('revalidation by introspection', () => {
		test('an inactive token: revoked, inactive', async () => {
			const { provider, session } = await signedIn('introspection')
			idp.revokeAll()

			expect(await provider.revalidate(configuration('introspection'), session)).toEqual({ status: 'revoked', reason: 'inactive' })
		})

		test('no stored token: revoked without a request', async () => {
			const { provider } = await signedIn('introspection')
			const before = idp.requests.length

			expect(await provider.revalidate(configuration('introspection'), { tokens: {} })).toEqual({ status: 'revoked', reason: 'no_token' })
			expect(idp.requests).toHaveLength(before)
		})

		// RFC 7662 reports a dead token as 200 { active: false }; an error response is about the request or the client
		test.each<[string, FakeIdpOverride, Thrown]>([
			['400 invalid_grant', respond(400, { error: 'invalid_grant' }), bodyError('invalid_grant')],
			['400 invalid_token', respond(400, { error: 'invalid_token' }), bodyError('invalid_token')],
			['400 expired_token', respond(400, { error: 'expired_token' }), bodyError('expired_token')],
			['401 invalid_client', respond(401, { error: 'invalid_client' }), bodyError('invalid_client')],
			['401 without a body', respond(401), [ClientError, { code: 'OAUTH_RESPONSE_IS_NOT_JSON', cause: expect.objectContaining({ status: 401 }) }]],
			['500', respond(500, 'boom'), notConform(500)],
		])('%s: thrown, session kept', async (_, override, [errorClass, identity]) => {
			const { provider, session } = await signedIn('introspection')
			idp.override('introspection', override)

			const promise = provider.revalidate(configuration('introspection'), session)

			await expect(promise).rejects.toBeInstanceOf(errorClass)
			await expect(promise).rejects.toMatchObject(identity)
		})
	})

	test.each<['userinfo' | 'introspection']>([['userinfo'], ['introspection']])(
		'%s endpoint that never answers: thrown as a timeout, session kept',
		async method => {
			const { provider, session } = await signedIn(method)
			idp.override(method, { kind: 'hang' })

			const promise = provider.revalidate(configuration(method), session)

			await expect(promise).rejects.toBeInstanceOf(timedOut[0])
			await expect(promise).rejects.toMatchObject(timedOut[1])
		},
	)

	describe('sign-in', () => {
		const signInWith = async (overrides: Partial<OIDCConfiguration> = {}) =>
			await signIn(new OIDCProvider(null, null), configurationFor(idp, { timeout: TIMEOUT_MS, ...overrides }), idp)

		test.each<[string, FakeIdpOverride, string]>([
			['400 invalid_grant', respond(400, { error: 'invalid_grant', error_description: 'code expired' }), 'invalid_grant (code expired)'],
			['500 with a plain-text body', respond(500, 'boom'), 'unexpected HTTP response status code: 500'],
			// the `{ error: { message } }` body is read by handleOIDCResponse itself
			['400 with a non-standard JSON error object', respond(400, { error: { message: 'bad code' } }), 'bad code'],
		])('token endpoint %s: IDPResponseError', async (_, override, message) => {
			idp.override('token', override)

			const promise = signInWith()

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow(message)
		})

		test('a token endpoint that never answers: IDPValidationError, as openid-client 5 reported a timeout as a client-side failure', async () => {
			idp.override('token', { kind: 'hang' })

			const promise = signInWith()

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('operation timed out')
		})

		test('userinfo failing at sign-in: IDPResponseError', async () => {
			idp.override('userinfo', respond(500, 'boom'))

			const promise = signInWith({ fetchUserInfo: true })

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow('unexpected HTTP response status code: 500')
		})

		test.each<[string, Partial<OIDCConfiguration>]>([
			['code', {}],
			['code, strict', { strictResponseType: true }],
			['id_token, strict', { responseType: 'id_token', strictResponseType: true }],
			['code id_token, strict', { responseType: 'code id_token', strictResponseType: true }],
		])('an error redirect from the authorization endpoint (%s): IDPResponseError', async (_, overrides) => {
			const provider = new OIDCProvider(null, signer)
			const configuration = configurationFor(idp, overrides)
			const init = await startSignIn(provider, configuration)

			const promise = provider.processResponse(configuration, {
				parameters: { error: 'access_denied', error_description: 'the user cancelled', state: sessionDataOf(init).state },
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow('access_denied (the user cancelled)')
		})

		test.each<[string, Partial<OIDCConfiguration>]>([
			['id_token', { responseType: 'id_token' }],
			['id_token token', { responseType: 'id_token token' }],
			['a bare id_token in a non-strict code configuration', {}],
		])('%s: a parameter the callback is not read for does not reach the response', async (_, overrides) => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { ...overrides, returnOIDCResult: true })
			const init = await startSignIn(provider, { ...configuration, responseType: overrides.responseType ?? 'id_token' })
			const authorization = await idp.authorize(init.authUrl)

			const response = await provider.processResponse(configuration, {
				parameters: { ...authorization.parameters, groups: 'admins', email: 'someone-else@example.com' },
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})

			expect(response).not.toHaveProperty('groups')
			expect(response.email).toBe('jane@example.com')
		})

		test('strict id_token token without token_type: IDPValidationError', async () => {
			const provider = new OIDCProvider(null, signer)
			const configuration = configurationFor(idp, { responseType: 'id_token token', strictResponseType: true })
			const init = await startSignIn(provider, configuration)
			const { token_type, ...parameters } = (await idp.authorize(init.authUrl)).parameters

			const promise = provider.processResponse(configuration, { parameters, redirectUrl: REDIRECT_URL, sessionData: init.sessionData })

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('token_type missing from the response for response type "id_token token"')
		})

		test.each<[NonNullable<OIDCConfiguration['responseType']>, string, string]>([
			['code', `${REDIRECT_URL}?tenant=a`, `normalized form: ${REDIRECT_URL}`],
			['code', `${REDIRECT_URL}#/login`, `normalized form: ${REDIRECT_URL}`],
			['code', `${REDIRECT_URL}?`, `normalized form: ${REDIRECT_URL}`],
			['code', `${REDIRECT_URL}#`, `normalized form: ${REDIRECT_URL}`],
			['code', 'https://app.example.com', 'normalized form: https://app.example.com/'],
			['code', 'HTTPS://App.Example.com/callback', `normalized form: ${REDIRECT_URL}`],
			['code id_token', `${REDIRECT_URL}?tenant=a`, `normalized form: ${REDIRECT_URL}`],
			['code', 'not a url', 'redirectUrl is not a valid URL'],
		])('initAuth for %s with redirectUrl %s: IDPValidationError before the redirect', async (responseType, redirectUrl, message) => {
			const promise = new OIDCProvider(null, null).initAuth(configurationFor(idp, { responseType }), { redirectUrl })

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow(message)
		})

		test('initAuth for id_token keeps a redirectUrl with a query: the ID token comes in the fragment', async () => {
			const init = await new OIDCProvider(null, null).initAuth(configurationFor(idp, { responseType: 'id_token' }), {
				redirectUrl: `${REDIRECT_URL}?tenant=a`,
			})

			expect(new URL(init.authUrl).searchParams.get('redirect_uri')).toBe(`${REDIRECT_URL}?tenant=a`)
		})

		test.each<[string, { url: string } | { parameters: Record<string, string> }, string, string]>([
			['callback url', { url: 'not a url' }, REDIRECT_URL, 'url is not a valid URL'],
			['redirectUrl', { parameters: { code: 'c' } }, 'not a url', 'redirectUrl is not a valid URL'],
		])('a malformed %s at the callback: IDPValidationError', async (_, data, redirectUrl, message) => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp)
			const init = await startSignIn(provider, configuration)

			const promise = provider.processResponse(configuration, { ...data, redirectUrl, sessionData: { nonce: sessionDataOf(init).nonce } })

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow(message)
		})

		test('an empty error parameter is no error response: strictResponseType still refuses a bare id_token for code', async () => {
			const provider = new OIDCProvider(null, signer)
			const configuration = configurationFor(idp, { strictResponseType: true })
			const init = await startSignIn(provider, configuration)
			const authUrl = new URL(init.authUrl)
			authUrl.searchParams.set('response_type', 'id_token')
			const authorization = await idp.authorize(authUrl.href)

			const promise = provider.processResponse(configuration, {
				parameters: { ...authorization.parameters, error: '' },
				sessionData: init.sessionData,
			})

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('id_token not expected for response type "code"')
			expect(idp.requestsTo('token')).toHaveLength(0)
		})

		const implicitSignIn = async (expiresIn: string) => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { responseType: 'id_token token', revalidation: { enabled: true }, returnOIDCResult: true })
			const init = await startSignIn(provider, configuration)
			const authorization = await idp.authorize(init.authUrl)
			const before = Math.floor(Date.now() / 1000)
			const response = await provider.processResponse(configuration, {
				parameters: { ...authorization.parameters, expires_in: expiresIn },
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})
			const { exp } = decodeJwt(authorization.parameters.id_token)
			return { response, before, idTokenExp: exp ?? 0 }
		}

		test('an implicit expires_in beyond the ID token: the stored session expires with the ID token', async () => {
			const { response, before, idTokenExp } = await implicitSignIn('999999999')

			expect(response.idpSession?.expiresAt).toEqual(new Date(idTokenExp * 1000))
			// what the IdP sent is still handed back as is
			expect(response.expires_at).toBeGreaterThanOrEqual(before + 999999999)
		})

		test('an implicit expires_in within the ID token lifetime: kept', async () => {
			const { response, before, idTokenExp } = await implicitSignIn('5')

			expect(idTokenExp).toBeGreaterThan(before + 5)
			expect(response.idpSession?.expiresAt?.getTime()).toBeWithin((before + 5) * 1000, (before + 7) * 1000)
		})

		test('a malformed id_token beside an access token: IDPValidationError', async () => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { responseType: 'code id_token token' })
			const init = await startSignIn(provider, configuration)
			const authorization = await idp.authorize(init.authUrl)

			const promise = provider.processResponse(configuration, {
				parameters: { ...authorization.parameters, id_token: 'garbage' },
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('malformed id_token')
		})

		const tampered = async (change: (it: { parameters: Record<string, string>; sessionData: Record<string, string> }) => void) => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { responseType: 'id_token' })
			const init = await startSignIn(provider, configuration)
			const authorization = await idp.authorize(init.authUrl)
			const callback = { parameters: { ...authorization.parameters }, sessionData: { ...sessionDataOf(init) } }
			change(callback)
			return provider.processResponse(configuration, { ...callback, redirectUrl: REDIRECT_URL })
		}

		test.each<[string, (it: { parameters: Record<string, string>; sessionData: Record<string, string> }) => void, string]>([
			['state mismatch', it => void (it.sessionData.state = 'other-state'), 'unexpected "state" response parameter value'],
			['nonce mismatch', it => void (it.sessionData.nonce = 'other-nonce'), 'unexpected ID Token "nonce" claim value'],
			[
				'state in the callback but not in the session data',
				it => void (it.sessionData = {}),
				'state is present in parameters, but missing in session data',
			],
		])('%s: IDPValidationError', async (_, change, message) => {
			const promise = tampered(change)

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow(message)
		})

		test('an ID token signed with a key the IdP does not publish: IDPValidationError, the JWKS fetched once', async () => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { responseType: 'id_token' })
			const init = await startSignIn(provider, configuration)
			const now = Math.floor(Date.now() / 1000)
			const idToken = await idp.sign(
				{ iss: idp.issuer, aud: idp.client.clientId, sub: 'user-1', iat: now, exp: now + 60, nonce: sessionDataOf(init).nonce },
				{ kid: 'unknown-key' },
			)

			const result = provider.processResponse(configuration, {
				parameters: { id_token: idToken, state: sessionDataOf(init).state },
				redirectUrl: REDIRECT_URL,
				sessionData: sessionDataOf(init),
			})

			await expect(result).rejects.toBeInstanceOf(IDPValidationError)
			await expect(result).rejects.toThrow('error when selecting a JWT verification key, no applicable keys found')
			expect(idp.endpointsHit()).toEqual(['discovery', 'jwks'])
		})
	})
})
