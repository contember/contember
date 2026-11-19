import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { jwtVerify } from 'jose'
import { IDPResponseError } from '../../../../src/model/service/idp/IDPResponseError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp } from './FakeIdp.js'
import { configurationFor, signIn } from './harness.js'

/** Pins how the client authenticates to the token and introspection endpoints. */
describe('OIDC client authentication', () => {
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

	/** Sign in with the code flow (token endpoint), then probe the session by introspection. */
	const signInAndIntrospect = async (configuration: OIDCConfiguration) => {
		const provider = new OIDCProvider(null, null)
		const { response } = await signIn(provider, configuration, idp)
		const result = await provider.revalidate(
			{ ...configuration, revalidation: { enabled: true, method: 'introspection' } },
			response.idpSession ?? { tokens: {} },
		)
		return { response, result }
	}

	test('the default is client_secret_basic, on the token and the introspection endpoint alike', async () => {
		const { result } = await signInAndIntrospect(configurationFor(idp, { revalidation: { enabled: true, method: 'introspection' } }))

		expect(result).toEqual({ status: 'valid' })
		expect(idp.clientAuth).toEqual([
			{ endpoint: 'token', auth: { method: 'client_secret_basic', clientId: idp.client.clientId, clientSecret: idp.client.clientSecret } },
			{ endpoint: 'introspection', auth: { method: 'client_secret_basic', clientId: idp.client.clientId, clientSecret: idp.client.clientSecret } },
		])
		const tokenRequest = idp.requestsTo('token')[0]
		expect(tokenRequest.form.client_id).toBeUndefined()
		expect(tokenRequest.form.client_secret).toBeUndefined()
	})

	test("client_secret_basic form-encodes both parts, leaving - _ . ! ~ * ' ( ) unencoded", async () => {
		idp.client = { clientId: 'client id:1', clientSecret: "s3cr3t!~*'()-_.+/&=%" }

		await signIn(new OIDCProvider(null, null), configurationFor(idp), idp)

		const header = idp.requestsTo('token')[0].headers.authorization
		expect(header).toBe(`Basic ${Buffer.from("client+id%3A1:s3cr3t!~*'()-_.%2B%2F%26%3D%25").toString('base64')}`)
		expect(idp.clientAuth[0].auth).toEqual({ method: 'client_secret_basic', clientId: 'client id:1', clientSecret: "s3cr3t!~*'()-_.+/&=%" })
	})

	test('client_secret_post sends the credentials in the body, on both endpoints', async () => {
		const configuration = configurationFor(idp, {
			tokenEndpointAuthMethod: 'client_secret_post',
			revalidation: { enabled: true, method: 'introspection' },
		})

		const { result } = await signInAndIntrospect(configuration)

		expect(result).toEqual({ status: 'valid' })
		expect(idp.clientAuth.map(it => [it.endpoint, it.auth.method])).toEqual([['token', 'client_secret_post'], ['introspection', 'client_secret_post']])
		for (const request of [...idp.requestsTo('token'), ...idp.requestsTo('introspection')]) {
			expect(request.headers.authorization).toBeUndefined()
			expect(request.form.client_id).toBe(idp.client.clientId)
			expect(request.form.client_secret).toBe(idp.client.clientSecret)
		}
	})

	test('client_secret_jwt signs an HS256 assertion with the secret, its audience the issuer', async () => {
		await signIn(new OIDCProvider(null, null), configurationFor(idp, { tokenEndpointAuthMethod: 'client_secret_jwt' }), idp)

		const auth = idp.clientAuth[0].auth
		if (auth.method !== 'client_secret_jwt') {
			throw new Error(`expected client_secret_jwt, got ${auth.method}`)
		}
		expect(idp.requestsTo('token')[0].form.client_assertion_type).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
		expect(auth.clientId).toBe(idp.client.clientId)
		const { payload, protectedHeader } = await jwtVerify(auth.assertion, new TextEncoder().encode(idp.client.clientSecret))
		expect(protectedHeader.alg).toBe('HS256')
		expect(payload).toEqual({
			iss: idp.client.clientId,
			sub: idp.client.clientId,
			aud: idp.issuer,
			iat: expect.any(Number),
			exp: expect.any(Number),
			jti: expect.any(String),
		})
	})

	test('none sends only the client id', async () => {
		// the fake IdP refuses unauthenticated clients, as a confidential client registration does
		const promise = signIn(new OIDCProvider(null, null), configurationFor(idp, { tokenEndpointAuthMethod: 'none' }), idp)

		await expect(promise).rejects.toBeInstanceOf(IDPResponseError)
		await expect(promise).rejects.toThrow('invalid_client')
		expect(idp.clientAuth[0].auth).toEqual({ method: 'none', clientId: idp.client.clientId })
		expect(idp.requestsTo('token')[0].headers.authorization).toBeUndefined()
	})
})
