import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp } from '../oidcHarness/FakeIdp.js'
import { configurationFor, REDIRECT_URL, sessionDataOf, signer, startSignIn, useRuntimeGlobals } from '../oidcHarness/harness.js'

describe('OIDC callback response type', () => {
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

	/** An ID token for this client carrying a nonce of the caller's choice, as the client itself could obtain one. */
	const idToken = async (nonce: string) => {
		const now = Math.floor(Date.now() / 1000)
		return await idp.sign({ iss: idp.issuer, aud: idp.client.clientId, sub: 'subject-1', email: 'jane@example.com', iat: now, exp: now + 300, nonce })
	}

	/** A callback carrying only the given parameters, with the session data `initAuth` issued. */
	const callback = async (
		configuration: OIDCConfiguration,
		parameters: (session: { nonce: string; state: string }) => Promise<Record<string, string>>,
	) => {
		const provider = new OIDCProvider(null, signer)
		const init = await startSignIn(provider, configuration)
		return await provider.processResponse(configuration, {
			parameters: await parameters(sessionDataOf(init)),
			redirectUrl: REDIRECT_URL,
			sessionData: init.sessionData,
		})
	}

	test("without strictResponseType a bare ID token with a nonce of the caller's choice completes a code-flow sign-in", async () => {
		const provider = new OIDCProvider(null, null)
		const configuration = configurationFor(idp)

		const response = await provider.processResponse(configuration, {
			parameters: { id_token: await idToken('caller-chosen'), state: 'caller-state' },
			redirectUrl: REDIRECT_URL,
			sessionData: { nonce: 'caller-chosen', state: 'caller-state' },
		})

		expect(response.externalIdentifier).toBe('subject-1')
	})

	test('with strictResponseType a bare ID token is refused for the code flow', async () => {
		const promise = callback(
			configurationFor(idp, { strictResponseType: true }),
			async ({ nonce, state }) => ({ id_token: await idToken(nonce), state }),
		)

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('id_token not expected for response type "code"')
	})

	test('with strictResponseType a code-flow callback without a code is refused', async () => {
		const promise = callback(configurationFor(idp, { strictResponseType: true }), async ({ state }) => ({ state }))

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('code missing from the response for response type "code"')
	})

	test('with strictResponseType an ID token is accepted where the response type includes it', async () => {
		const configuration = configurationFor(idp, { responseType: 'id_token', strictResponseType: true })

		const response = await callback(configuration, async ({ nonce, state }) => ({ id_token: await idToken(nonce), state }))

		expect(response.externalIdentifier).toBe('subject-1')
	})
})
