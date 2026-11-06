import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import http from 'node:http'
import { SignJWT } from 'jose'
import { DataSigner } from '../../../../src/index.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { InvalidIDPConfigurationError } from '../../../../src/model/service/idp/InvalidIDPConfigurationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'

// HS256 signs the ID token with the client secret, so the client validates it without fetching keys.
const CLIENT_SECRET = 'a-client-secret-of-at-least-thirty-two-bytes'
const REDIRECT_URL = 'https://app.example.com/callback'

const signer: DataSigner = (purpose, value) => createHmac('sha256', `test-key:${purpose}`).update(value).digest()

describe('OIDC session data signing with strictResponseType', () => {
	let server: http.Server
	let issuer = ''

	beforeAll(async () => {
		server = http.createServer((req, res) => {
			req.resume()
			if (req.url === '/.well-known/openid-configuration') {
				res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
					issuer,
					authorization_endpoint: `${issuer}/authorize`,
					token_endpoint: `${issuer}/token`,
					jwks_uri: `${issuer}/jwks`,
				}))
				return
			}
			res.writeHead(404).end()
		})
		await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
		const address = server.address()
		issuer = `http://127.0.0.1:${typeof address === 'object' && address !== null ? address.port : 0}`
	})

	afterAll(() => {
		server.close()
	})

	const configuration = (strictResponseType: boolean): OIDCConfiguration => ({
		url: issuer,
		clientId: 'client',
		clientSecret: CLIENT_SECRET,
		responseType: 'id_token',
		idTokenSignedResponseAlg: 'HS256',
		strictResponseType,
	})

	const idToken = (nonce: string) =>
		new SignJWT({ sub: 'subject-1', email: 'jane@example.com', nonce })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuer(issuer)
			.setAudience('client')
			.setIssuedAt()
			.setExpirationTime('5m')
			.sign(new TextEncoder().encode(CLIENT_SECRET))

	const init = async (provider: OIDCProvider, strict: boolean) => {
		const result = await provider.initAuth(configuration(strict), { redirectUrl: REDIRECT_URL })
		const sessionData = result.sessionData
		if (typeof sessionData !== 'object' || sessionData === null || !('nonce' in sessionData) || !('state' in sessionData)) {
			throw new Error('unexpected session data')
		}
		return { nonce: String(sessionData.nonce), state: String(sessionData.state), sessionData }
	}

	const callback = async (provider: OIDCProvider, nonce: string, state: string, sessionData: object) =>
		provider.processResponse(configuration(true), {
			parameters: { id_token: await idToken(nonce), state },
			redirectUrl: REDIRECT_URL,
			sessionData,
		})

	test('session data issued at init completes the callback', async () => {
		const provider = new OIDCProvider(null, signer)
		const { nonce, state, sessionData } = await init(provider, true)

		expect(sessionData).toHaveProperty('signature')
		expect((await callback(provider, nonce, state, sessionData)).externalIdentifier).toBe('subject-1')
	})

	test('a nonce chosen by the client is refused', async () => {
		const provider = new OIDCProvider(null, signer)
		const { state, sessionData } = await init(provider, true)

		const promise = callback(provider, 'client-chosen', state, { ...sessionData, nonce: 'client-chosen' })
		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('session data signature is invalid')
	})

	test('unsigned session data is refused', async () => {
		const provider = new OIDCProvider(null, signer)
		const { nonce, state } = await init(provider, true)

		await expect(callback(provider, nonce, state, { nonce, state })).rejects.toThrow('signed session data is required')
	})

	test('session data signed for another provider is refused', async () => {
		const provider = new OIDCProvider(null, signer)
		const { nonce, state, sessionData } = await init(provider, true)
		const otherSigner: DataSigner = (purpose, value) => createHmac('sha256', `other-key:${purpose}`).update(value).digest()

		await expect(callback(new OIDCProvider(null, otherSigner), nonce, state, sessionData)).rejects.toThrow('session data signature is invalid')
	})

	test('without strictResponseType session data stays unsigned', async () => {
		const { sessionData } = await init(new OIDCProvider(null, signer), false)

		expect(sessionData).not.toHaveProperty('signature')
	})

	test('strictResponseType cannot be configured without a signing key', () => {
		expect(() => new OIDCProvider(null, null).validateWrittenConfiguration(configuration(true))).toThrow(InvalidIDPConfigurationError)
		expect(() => new OIDCProvider(null, signer).validateWrittenConfiguration(configuration(true))).not.toThrow()
		expect(() => new OIDCProvider(null, null).validateWrittenConfiguration(configuration(false))).not.toThrow()
	})
})
