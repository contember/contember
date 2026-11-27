import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { DataSigner } from '../../../../src/index.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { InvalidIDPConfigurationError } from '../../../../src/model/service/idp/InvalidIDPConfigurationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp } from '../oidcHarness/FakeIdp.js'
import { configurationFor, REDIRECT_URL, signer, useRuntimeGlobals } from '../oidcHarness/harness.js'

describe('OIDC session data signing with strictResponseType', () => {
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

	const configuration = (strictResponseType: boolean): OIDCConfiguration => configurationFor(idp, { responseType: 'id_token', strictResponseType })

	/** An ID token for this client carrying a nonce of the caller's choice, as the client itself could obtain one. */
	const idToken = async (nonce: string) => {
		const now = Math.floor(Date.now() / 1000)
		return await idp.sign({ iss: idp.issuer, aud: idp.client.clientId, sub: 'subject-1', email: 'jane@example.com', iat: now, exp: now + 300, nonce })
	}

	const init = async (provider: OIDCProvider, strict: boolean) => {
		const result = await provider.initAuth(configuration(strict), { redirectUrl: REDIRECT_URL })
		const sessionData = result.sessionData
		if (typeof sessionData !== 'object' || sessionData === null || !('nonce' in sessionData) || !('state' in sessionData)) {
			throw new Error('unexpected session data')
		}
		return { nonce: String(sessionData.nonce), state: String(sessionData.state), sessionData }
	}

	const callback = async (provider: OIDCProvider, nonce: string, state: string, sessionData: object) =>
		await provider.processResponse(configuration(true), {
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
