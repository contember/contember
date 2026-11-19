import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { FakeIdp, FakeIdpEndpoint } from './FakeIdp.js'
import { authUrlParameters, configurationFor, REDIRECT_URL, signer, signIn, startSignIn } from './harness.js'

/**
 * Pins the sign-in flow for every `responseType` a stored OIDC provider configuration may hold, with and without
 * `strictResponseType`, against a real HTTP IdP.
 */

type ResponseType = 'code' | 'code id_token' | 'code id_token token' | 'code token' | 'id_token' | 'id_token token' | 'none'

interface Expectation {
	/** Where the IdP puts the response parameters by default. */
	readonly mode: 'query' | 'fragment'
	/** Parameters of the authorization response, besides `state`. */
	readonly parameters: readonly string[]
	/** IdP endpoints the RP calls after the browser returns, in order. */
	readonly callbackRequests: readonly FakeIdpEndpoint[]
}

const EXPECTATIONS: Record<ResponseType, Expectation> = {
	'code': { mode: 'query', parameters: ['code'], callbackRequests: ['token', 'jwks'] },
	'code id_token': { mode: 'fragment', parameters: ['code', 'id_token'], callbackRequests: ['jwks', 'token'] },
	'code id_token token': {
		mode: 'fragment',
		parameters: ['access_token', 'code', 'expires_in', 'id_token', 'token_type'],
		callbackRequests: ['jwks', 'token'],
	},
	'code token': { mode: 'fragment', parameters: ['access_token', 'code', 'expires_in', 'token_type'], callbackRequests: ['token', 'jwks'] },
	'id_token': { mode: 'fragment', parameters: ['id_token'], callbackRequests: ['jwks'] },
	'id_token token': { mode: 'fragment', parameters: ['access_token', 'expires_in', 'id_token', 'token_type'], callbackRequests: ['jwks'] },
	'none': { mode: 'query', parameters: [], callbackRequests: [] },
}

const RESPONSE_TYPES = Object.keys(EXPECTATIONS).filter((it): it is ResponseType => it in EXPECTATIONS)

describe('OIDC sign-in per stored response type', () => {
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

	describe.each([false, true])('strictResponseType: %p', strict => {
		const provider = () => new OIDCProvider(null, signer)

		test.each(RESPONSE_TYPES.filter(it => it !== 'none'))('%s signs the user in', async responseType => {
			const expectation = EXPECTATIONS[responseType]
			const configuration = configurationFor(idp, { responseType, strictResponseType: strict })

			const { init, authorization, response } = await signIn(provider(), configuration, idp)

			expect(authUrlParameters(init.authUrl)).toEqual({
				client_id: idp.client.clientId,
				scope: 'openid email',
				response_type: responseType,
				redirect_uri: REDIRECT_URL,
				nonce: expect.any(String),
				state: expect.any(String),
			})
			expect(init.authUrl).toStartWith(`${idp.endpointUrl('authorization')}?`)
			expect(Object.keys(init.sessionData ?? {}).sort()).toEqual(strict ? ['nonce', 'signature', 'state'] : ['nonce', 'state'])
			expect(authorization.mode).toBe(expectation.mode)
			expect(Object.keys(authorization.parameters).sort()).toEqual([...expectation.parameters, 'state'].sort())
			expect(idp.endpointsHit()).toEqual(['discovery', 'authorization', ...expectation.callbackRequests])
			expect(response).toEqual({
				sub: 'user-1',
				email: 'jane@example.com',
				email_verified: true,
				name: 'Jane Doe',
				iss: idp.issuer,
				aud: idp.client.clientId,
				iat: expect.any(Number),
				exp: expect.any(Number),
				auth_time: expect.any(Number),
				sid: 'idp-session-1',
				externalIdentifier: 'user-1',
				emailVerified: true,
			})
		})

		test('none fails after the redirect: openid-client reads claims of a token set without an ID token', async () => {
			const configuration = configurationFor(idp, { responseType: 'none', strictResponseType: strict })

			const promise = signIn(provider(), configuration, idp)

			await expect(promise).rejects.toBeInstanceOf(TypeError)
			await expect(promise).rejects.toThrow('id_token not present in TokenSet')
			expect(idp.endpointsHit()).toEqual(['discovery', 'authorization'])
		})
	})

	describe('an IdP answering with every token although the provider asked for fewer', () => {
		/** The browser (or an attacker) changes `response_type` before it reaches the IdP. */
		const signInWithEscalatedResponseType = async (responseType: ResponseType, strict: boolean) => {
			const provider = new OIDCProvider(null, signer)
			const configuration = configurationFor(idp, { responseType, strictResponseType: strict })
			const init = await startSignIn(provider, configuration)
			const authUrl = new URL(init.authUrl)
			authUrl.searchParams.set('response_type', 'code id_token token')
			const authorization = await idp.authorize(authUrl.toString())
			return await provider.processResponse(configuration, {
				parameters: authorization.parameters,
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})
		}

		const narrower = RESPONSE_TYPES.filter(it => it !== 'code id_token token' && it !== 'none')

		test.each(narrower)('%s without strictResponseType: accepted', async responseType => {
			const response = await signInWithEscalatedResponseType(responseType, false)

			expect(response.externalIdentifier).toBe('user-1')
		})

		const unexpected: Record<string, string> = {
			'code': 'id_token, access_token',
			'code id_token': 'access_token',
			'code token': 'id_token',
			'id_token': 'access_token, code',
			'id_token token': 'code',
		}

		test.each(narrower)('%s with strictResponseType: refused', async responseType => {
			const promise = signInWithEscalatedResponseType(responseType, true)

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow(`${unexpected[responseType]} not expected for response type "${responseType}"`)
		})
	})

	describe('an ID token from the authorization endpoint is bound to the code and access token beside it', () => {
		/** Two authorizations of one sign-in; the callback combines the ID token of the first with `parameter` of the second. */
		const signInWithSwapped = async (responseType: ResponseType, parameter: 'code' | 'access_token') => {
			const provider = new OIDCProvider(null, null)
			const configuration = configurationFor(idp, { responseType })
			const init = await startSignIn(provider, configuration)
			const first = await idp.authorize(init.authUrl)
			const second = await idp.authorize(init.authUrl)
			return await provider.processResponse(configuration, {
				parameters: { ...first.parameters, [parameter]: second.parameters[parameter] },
				redirectUrl: REDIRECT_URL,
				sessionData: init.sessionData,
			})
		}

		test('code id_token with another code: refused on c_hash', async () => {
			const promise = signInWithSwapped('code id_token', 'code')

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('c_hash mismatch')
		})

		test('id_token token with another access token: refused on at_hash', async () => {
			const promise = signInWithSwapped('id_token token', 'access_token')

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('at_hash mismatch')
		})
	})

	describe('response modes and callback shapes', () => {
		test('form_post: the parameters arrive in a form and are passed on as parameters', async () => {
			const { init, authorization, response } = await signIn(new OIDCProvider(null, null), configurationFor(idp), idp, { responseMode: 'form_post' })

			expect(authUrlParameters(init.authUrl).response_mode).toBe('form_post')
			expect(authorization.mode).toBe('form_post')
			expect(authorization.redirectTo).toBe(REDIRECT_URL)
			expect(response.externalIdentifier).toBe('user-1')
		})

		test('code flow: the callback URL itself may be passed instead of its parameters', async () => {
			const { response } = await signIn(new OIDCProvider(null, null), configurationFor(idp), idp, { passAs: 'url' })

			expect(response.externalIdentifier).toBe('user-1')
		})

		test('implicit flow: the URL form reads only the query, so the fragment-borne response is missing', async () => {
			const promise = signIn(new OIDCProvider(null, null), configurationFor(idp, { responseType: 'id_token' }), idp, { passAs: 'url' })

			await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
			await expect(promise).rejects.toThrow('state missing from the response')
		})

		test('the scope comes from `scope`, then the deprecated `claims`, then the default', async () => {
			const scopeOf = async (overrides: { scope?: string; claims?: string }) =>
				authUrlParameters((await startSignIn(new OIDCProvider(null, null), configurationFor(idp, overrides))).authUrl).scope

			expect(await scopeOf({})).toBe('openid email')
			expect(await scopeOf({ claims: 'openid profile' })).toBe('openid profile')
			expect(await scopeOf({ scope: 'openid', claims: 'openid profile' })).toBe('openid')
		})

		test('the discovery document is fetched once per provider instance and IdP URL', async () => {
			const provider = new OIDCProvider(null, null)
			await signIn(provider, configurationFor(idp), idp)
			await signIn(provider, configurationFor(idp), idp)

			expect(idp.requestsTo('discovery')).toHaveLength(1)
			// the JWKS is cached on the issuer, so the second ID token is verified without a fetch
			expect(idp.requestsTo('jwks')).toHaveLength(1)
		})
	})
})
