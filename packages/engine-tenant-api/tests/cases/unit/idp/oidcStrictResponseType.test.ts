import { describe, expect, test } from 'bun:test'
import { SignJWT } from 'jose'
import { Issuer } from 'openid-client'
import { handleOIDCResponse } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'

// HS256 signs the ID token with the client secret, so the client validates it without fetching keys.
const CLIENT_SECRET = 'a-client-secret-of-at-least-thirty-two-bytes'
const ISSUER = 'https://idp.example.com'

const createClient = () => {
	const issuer = new Issuer({
		issuer: ISSUER,
		authorization_endpoint: `${ISSUER}/authorize`,
		token_endpoint: `${ISSUER}/token`,
		jwks_uri: `${ISSUER}/jwks`,
	})
	return new issuer.Client({
		client_id: 'client',
		client_secret: CLIENT_SECRET,
		response_types: ['code'],
		id_token_signed_response_alg: 'HS256',
	})
}

/** An ID token for this client carrying a nonce of the caller's choice, as the client itself could obtain one. */
const createIdToken = (nonce: string) =>
	new SignJWT({ sub: 'subject-1', email: 'jane@example.com', nonce })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(ISSUER)
		.setAudience('client')
		.setIssuedAt()
		.setExpirationTime('5m')
		.sign(new TextEncoder().encode(CLIENT_SECRET))

const bareIdTokenResponse = async () => ({
	parameters: { id_token: await createIdToken('caller-chosen'), state: 'caller-state' },
	redirectUrl: 'https://app.example.com/callback',
	sessionData: { nonce: 'caller-chosen', state: 'caller-state' },
})

describe('OIDC callback response type', () => {
	test('without strictResponseType a bare ID token completes a code-flow sign-in', async () => {
		const response = await handleOIDCResponse(createClient(), await bareIdTokenResponse())

		expect(response.externalIdentifier).toBe('subject-1')
	})

	test('with strictResponseType a bare ID token is refused for the code flow', async () => {
		const promise = handleOIDCResponse(createClient(), await bareIdTokenResponse(), { expectedResponseType: 'code' })

		await expect(promise).rejects.toBeInstanceOf(IDPValidationError)
		await expect(promise).rejects.toThrow('id_token not expected for response type "code"')
	})

	test('with strictResponseType a code-flow callback without a code is refused', async () => {
		const promise = handleOIDCResponse(
			createClient(),
			{ parameters: { state: 'caller-state' }, redirectUrl: 'https://app.example.com/callback', sessionData: { state: 'caller-state' } },
			{ expectedResponseType: 'code' },
		)

		await expect(promise).rejects.toThrow('code missing from response')
	})

	test('with strictResponseType an ID token is accepted where the response type includes it', async () => {
		const response = await handleOIDCResponse(createClient(), await bareIdTokenResponse(), { expectedResponseType: 'id_token' })

		expect(response.externalIdentifier).toBe('subject-1')
	})
})
