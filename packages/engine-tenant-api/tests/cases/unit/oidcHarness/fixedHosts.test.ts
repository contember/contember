import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { decodeProtectedHeader, exportPKCS8, generateKeyPair, jwtVerify } from 'jose'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { AppleProvider } from '../../../../src/model/service/idp/providers/AppleProvider.js'
import { FacebookProvider } from '../../../../src/model/service/idp/providers/FacebookProvider.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { FakeIdp } from './FakeIdp.js'
import { authUrlParameters, REDIRECT_URL, useFetchRoutes, useRuntimeGlobals } from './harness.js'

/**
 * Pins the providers whose IdP sits on a fixed host the fake cannot be served as: Entra ID's multi-tenant discovery on
 * `login.microsoftonline.com`, Apple and Facebook. Their requests reach the fake through a routed global `fetch`.
 */

/** Requests to `origin` go to the fake IdP, path and query kept. */
const routeOrigin = (origin: string, idp: () => FakeIdp) => (url: URL): string | undefined =>
	url.origin === origin ? `${new URL(idp().baseUrl).origin}${url.pathname}${url.search}` : undefined

describe('Entra ID multi-tenant discovery on the Microsoft host', () => {
	useRuntimeGlobals()

	const MICROSOFT = 'https://login.microsoftonline.com'
	const started: FakeIdp[] = []
	let current: FakeIdp
	useFetchRoutes(routeOrigin(MICROSOFT, () => current))

	afterAll(async () => {
		for (const idp of started) {
			await idp.stop()
		}
	})

	const start = async (basePath: string, issuerTemplate: string, idTokenIssuer: string) => {
		current = await FakeIdp.start({ basePath, issuer: () => issuerTemplate, idTokenIssuer: () => idTokenIssuer, idTokenClaims: { tid: 'tenant-a' } })
		started.push(current)
		return current
	}

	const signIn = async (idp: FakeIdp, url: string) => {
		const provider = new OIDCProvider(null, null)
		const configuration = { url, clientId: idp.client.clientId, clientSecret: idp.client.clientSecret }
		const init = await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL })
		const authorization = await idp.authorize(init.authUrl)
		return await provider.processResponse(configuration, {
			parameters: authorization.parameters,
			redirectUrl: REDIRECT_URL,
			sessionData: init.sessionData,
		})
	}

	test.each([
		['/common/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-a/v2.0`],
		['/organizations/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-a/v2.0`],
		['/consumers/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-a/v2.0`],
		['/common', 'https://sts.windows.net/{tenantid}/', 'https://sts.windows.net/tenant-a/'],
	])("%s: {tenantid} in the issuer is the ID token's tid", async (basePath, issuerTemplate, tenantIssuer) => {
		const idp = await start(basePath, issuerTemplate, tenantIssuer)

		const response = await signIn(idp, `${MICROSOFT}${basePath}`)

		expect(response.iss).toBe(tenantIssuer)
		expect(idp.requestsTo('discovery').map(it => it.path)).toEqual([`${basePath}/.well-known/openid-configuration`])
	})

	test('the discovery document URL itself is treated the same', async () => {
		const idp = await start('/common/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-a/v2.0`)

		const response = await signIn(idp, `${MICROSOFT}/common/v2.0/.well-known/openid-configuration`)

		expect(response.iss).toBe(`${MICROSOFT}/tenant-a/v2.0`)
	})

	test('an ID token whose issuer names another tenant than its tid: refused', async () => {
		const idp = await start('/common/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-b/v2.0`)

		const promise = signIn(idp, `${MICROSOFT}/common/v2.0`)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('unexpected JWT "iss" (issuer) claim value')
	})

	test('a single-tenant URL on the Microsoft host compares the issuer literally: refused', async () => {
		const idp = await start('/tenant-a/v2.0', `${MICROSOFT}/{tenantid}/v2.0`, `${MICROSOFT}/tenant-a/v2.0`)

		const promise = signIn(idp, `${MICROSOFT}/tenant-a/v2.0`)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('unexpected JWT "iss" (issuer) claim value')
	})
})

describe('Sign in with Apple', () => {
	useRuntimeGlobals()

	const APPLE = 'https://appleid.apple.com'
	let idp: FakeIdp
	let keys: CryptoKeyPair
	useFetchRoutes(routeOrigin(APPLE, () => idp))

	beforeAll(async () => {
		// Apple's discovery advertises client_secret_post only
		idp = await FakeIdp.start({ issuer: () => APPLE, tokenEndpointAuthMethods: ['client_secret_post'] })
		keys = await generateKeyPair('ES256', { extractable: true })
	})
	afterAll(async () => {
		await idp.stop()
	})
	beforeEach(() => {
		idp.reset()
		idp.client = { clientId: 'com.example.app', clientSecret: 'never-sent' }
		idp.acceptAnyClientSecret = true
	})

	test('the client secret is an ES256 JWT from the configured key, sent as client_secret_post', async () => {
		const provider = new AppleProvider()
		const configuration = { keyId: 'KEY123', teamId: 'TEAM123', clientId: 'com.example.app', privateKey: await exportPKCS8(keys.privateKey) }

		const init = await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL, responseMode: 'form_post' })
		const authorization = await idp.authorize(init.authUrl)
		const response = await provider.processResponse(configuration, {
			parameters: authorization.parameters,
			redirectUrl: REDIRECT_URL,
			sessionData: init.sessionData,
		})

		expect(response).toMatchObject({ externalIdentifier: 'user-1', iss: APPLE, aud: 'com.example.app' })
		expect(authUrlParameters(init.authUrl)).toMatchObject({ client_id: 'com.example.app', response_type: 'code', response_mode: 'form_post' })
		expect(idp.endpointsHit()).toEqual(['discovery', 'authorization', 'token', 'jwks'])
		const auth = idp.clientAuth[0].auth
		if (auth.method !== 'client_secret_post') {
			throw new Error(`expected client_secret_post, got ${auth.method}`)
		}
		expect(decodeProtectedHeader(auth.clientSecret)).toEqual({ alg: 'ES256', typ: 'JWT', kid: 'KEY123' })
		const { payload } = await jwtVerify(auth.clientSecret, keys.publicKey, { algorithms: ['ES256'] })
		expect(payload).toEqual({ iss: 'TEAM123', sub: 'com.example.app', aud: APPLE, iat: expect.any(Number), exp: expect.any(Number) })
		expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(600)
	})

	test('discovery runs once per provider instance', async () => {
		const provider = new AppleProvider()
		const configuration = { keyId: 'KEY123', teamId: 'TEAM123', clientId: 'com.example.app', privateKey: await exportPKCS8(keys.privateKey) }

		await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL })
		await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL })

		expect(idp.requestsTo('discovery')).toHaveLength(1)
	})
})

describe('Facebook with its static issuer metadata', () => {
	useRuntimeGlobals()

	const FACEBOOK_ENDPOINTS: Record<string, 'jwks' | 'token'> = {
		'https://www.facebook.com/.well-known/oauth/openid/jwks/': 'jwks',
		'https://graph.facebook.com/v11.0/oauth/access_token': 'token',
	}
	const started: FakeIdp[] = []
	let idp: FakeIdp
	useFetchRoutes(url => {
		const endpoint = FACEBOOK_ENDPOINTS[`${url.origin}${url.pathname}`]
		return endpoint ? idp.endpointUrl(endpoint) : undefined
	})

	const start = async (idTokenIssuer?: string) => {
		idp = await FakeIdp.start({ issuer: () => 'https://www.facebook.com', ...(idTokenIssuer ? { idTokenIssuer: () => idTokenIssuer } : {}) })
		started.push(idp)
		return idp
	}
	afterAll(async () => {
		for (const it of started) {
			await it.stop()
		}
	})

	const signIn = async (responseType: 'code' | 'id_token') => {
		const provider = new FacebookProvider()
		const configuration = { url: 'unused', clientId: idp.client.clientId, clientSecret: idp.client.clientSecret, responseType }
		const init = await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL })
		// the browser goes to Facebook's dialog; the fake stands in for it with the same parameters
		const authorization = await idp.authorize(`${idp.endpointUrl('authorization')}${new URL(init.authUrl).search}`)
		const response = await provider.processResponse(configuration, {
			parameters: authorization.parameters,
			redirectUrl: REDIRECT_URL,
			sessionData: init.sessionData,
		})
		return { init, response }
	}

	test('id_token: no discovery, the ID token verified against the JWKS at the static jwks_uri', async () => {
		await start()

		const { init, response } = await signIn('id_token')

		expect(init.authUrl).toStartWith('https://facebook.com/dialog/oauth/?')
		expect(response).toMatchObject({ externalIdentifier: 'user-1', iss: 'https://www.facebook.com' })
		expect(idp.endpointsHit()).toEqual(['authorization', 'jwks'])
	})

	test('code: exchanged at the static token endpoint with client_secret_basic', async () => {
		await start()

		const { response } = await signIn('code')

		expect(response.externalIdentifier).toBe('user-1')
		expect(idp.endpointsHit()).toEqual(['authorization', 'token', 'jwks'])
		expect(idp.clientAuth.map(it => it.auth.method)).toEqual(['client_secret_basic'])
	})

	test('an ID token from another issuer: refused', async () => {
		await start('https://www.facebook.com/other')

		const promise = signIn('id_token')

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('unexpected JWT "iss" (issuer) claim value')
	})
})
