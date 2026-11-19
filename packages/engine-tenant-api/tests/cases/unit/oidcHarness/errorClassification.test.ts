import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { errors } from 'openid-client'
import { IDPSessionState } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { IDPResponseError } from '../../../../src/model/service/idp/IDPResponseError.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpOverride } from './FakeIdp.js'
import { configurationFor, REDIRECT_URL, sessionDataOf, signIn, startSignIn } from './harness.js'

/**
 * Pins which IdP failures end a session (`revoked`) and which propagate as transient errors (the caller keeps the
 * session: IdP downtime must not log everyone out), and how sign-in failures map onto the tenant API's error classes.
 * The openid-client error classes appear here on purpose: they are what `revalidateOIDC` and `handleOIDCResponse`
 * branch on today.
 */

const TIMEOUT_MS = 300

const respond = (status: number, body?: string | object, headers?: Record<string, string>): FakeIdpOverride => ({
	kind: 'respond',
	status,
	body,
	headers,
})

describe('OIDC failure classification', () => {
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

		const transient: [string, FakeIdpOverride, string][] = [
			['401 invalid_client', respond(401, { error: 'invalid_client' }), 'invalid_client'],
			['400 unauthorized_client', respond(400, { error: 'unauthorized_client' }), 'unauthorized_client'],
			['503 temporarily_unavailable', respond(503, { error: 'temporarily_unavailable' }), 'temporarily_unavailable'],
			['500 with a plain-text body', respond(500, 'boom'), 'expected 200 OK, got: 500 Internal Server Error'],
			['400 with a non-standard JSON error object', respond(400, { error: { message: 'bad refresh token' } }), 'expected 200 OK, got: 400 Bad Request'],
			['200 without a body', respond(200), 'expected 200 OK with body but no body was returned'],
		]

		test.each(transient)('%s: thrown as an OPError, session kept', async (_, override, message) => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', override)

			const promise = provider.revalidate(configuration('refresh'), session)

			await expect(promise).rejects.toBeInstanceOf(errors.OPError)
			await expect(promise).rejects.toThrow(message)
		})

		test('a token endpoint that never answers: thrown as an RPError after the configured timeout', async () => {
			const { provider, session } = await signedIn('refresh')
			idp.override('token', { kind: 'hang' })

			const promise = provider.revalidate(configuration('refresh'), session)

			await expect(promise).rejects.toBeInstanceOf(errors.RPError)
			await expect(promise).rejects.toThrow(`outgoing request timed out after ${TIMEOUT_MS}ms`)
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
			await expect(promise).rejects.not.toBeInstanceOf(errors.OPError)
			await expect(promise).rejects.not.toBeInstanceOf(errors.RPError)
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

			expect(await provider.revalidate(configuration('userinfo'), { tokens: {} })).toEqual({ status: 'revoked', reason: 'no_access_token' })
		})

		const transient: [string, FakeIdpOverride, string][] = [
			['403 insufficient_scope', respond(403, undefined, { 'www-authenticate': 'Bearer error="insufficient_scope"' }), 'insufficient_scope'],
			['500', respond(500, 'boom'), 'expected 200 OK, got: 500 Internal Server Error'],
		]

		test.each(transient)('%s: thrown as an OPError, session kept', async (_, override, message) => {
			const { provider, session } = await signedIn('userinfo')
			idp.override('userinfo', override)

			const promise = provider.revalidate(configuration('userinfo'), session)

			await expect(promise).rejects.toBeInstanceOf(errors.OPError)
			await expect(promise).rejects.toThrow(message)
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

			expect(await provider.revalidate(configuration('introspection'), { tokens: {} })).toEqual({ status: 'revoked', reason: 'no_token' })
		})

		test.each<[string, FakeIdpOverride, string]>([
			['401 invalid_client', respond(401, { error: 'invalid_client' }), 'invalid_client'],
			['401 without a body', respond(401), 'expected 200 OK, got: 401 Unauthorized'],
			['500', respond(500, 'boom'), 'expected 200 OK, got: 500 Internal Server Error'],
		])('%s: thrown as an OPError, session kept', async (_, override, message) => {
			const { provider, session } = await signedIn('introspection')
			idp.override('introspection', override)

			const promise = provider.revalidate(configuration('introspection'), session)

			await expect(promise).rejects.toBeInstanceOf(errors.OPError)
			await expect(promise).rejects.toThrow(message)
		})
	})

	describe('sign-in', () => {
		const signInWith = async (overrides: Partial<OIDCConfiguration> = {}) =>
			await signIn(new OIDCProvider(null, null), configurationFor(idp, { timeout: TIMEOUT_MS, ...overrides }), idp)

		test.each<[string, FakeIdpOverride, string]>([
			['400 invalid_grant', respond(400, { error: 'invalid_grant', error_description: 'code expired' }), 'invalid_grant (code expired)'],
			['500 with a plain-text body', respond(500, 'boom'), 'expected 200 OK, got: 500 Internal Server Error'],
			// the `{ error: { message } }` body is read by handleOIDCResponse itself
			['400 with a non-standard JSON error object', respond(400, { error: { message: 'bad code' } }), 'bad code'],
		])('token endpoint %s: IDPResponseError', async (_, override, message) => {
			idp.override('token', override)

			const promise = signInWith()

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow(message)
		})

		test('a token endpoint that never answers: IDPValidationError, as openid-client reports a timeout as an RPError', async () => {
			idp.override('token', { kind: 'hang' })

			const promise = signInWith()

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow(`outgoing request timed out after ${TIMEOUT_MS}ms`)
		})

		test('userinfo failing at sign-in: IDPResponseError', async () => {
			idp.override('userinfo', respond(500, 'boom'))

			const promise = signInWith({ fetchUserInfo: true })

			await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
			await expect(promise).rejects.toThrow('expected 200 OK, got: 500 Internal Server Error')
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
			['state mismatch', it => void (it.sessionData.state = 'other-state'), 'state mismatch'],
			['nonce mismatch', it => void (it.sessionData.nonce = 'other-nonce'), 'nonce mismatch'],
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
			await expect(result).rejects.toThrow("no valid key found in issuer's jwks_uri for key parameters")
			expect(idp.endpointsHit()).toEqual(['discovery', 'jwks'])
		})
	})
})
