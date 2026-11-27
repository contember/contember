import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { ClientError, ResponseBodyError, WWWAuthenticateChallengeError } from 'openid-client'
import { IDPSessionState } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { IDPResponseError } from '../../../../src/model/service/idp/IDPResponseError.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpOverride } from './FakeIdp.js'
import { configurationFor, REDIRECT_URL, sessionDataOf, signIn, startSignIn, useRuntimeGlobals } from './harness.js'

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

		test('an error redirect from the authorization endpoint: IDPResponseError', async () => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp)
			const init = await startSignIn(provider, configuration)

			const promise = provider.processResponse(configuration, {
				parameters: { error: 'access_denied', error_description: 'the user cancelled', state: sessionDataOf(init).state },
				redirectUrl: REDIRECT_URL,
				sessionData: sessionDataOf(init),
			})

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow('access_denied (the user cancelled)')
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
