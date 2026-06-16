import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { buildOIDCLogoutUrl, validateOIDCLogoutToken } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'

const clientWith = (endSessionEndpoint: string | undefined) => {
	const captured: { params?: any } = {}
	const client = {
		issuer: { metadata: { end_session_endpoint: endSessionEndpoint } },
		endSessionUrl: (params: any) => {
			captured.params = params
			const sp = new URLSearchParams()
			if (params.id_token_hint) {
				sp.set('id_token_hint', params.id_token_hint)
			}
			if (params.post_logout_redirect_uri) {
				sp.set('post_logout_redirect_uri', params.post_logout_redirect_uri)
			}
			const q = sp.toString()
			return q ? `${endSessionEndpoint}?${q}` : (endSessionEndpoint as string)
		},
	} as any
	return { client, captured }
}

describe('buildOIDCLogoutUrl', () => {
	test('no end_session_endpoint → null (graceful fallback)', () => {
		const { client } = clientWith(undefined)
		expect(buildOIDCLogoutUrl(client, { idToken: 'id-1' })).toBeNull()
	})

	test('builds URL with id_token_hint and post_logout_redirect_uri', () => {
		const { client, captured } = clientWith('https://idp.example.com/logout')
		const url = buildOIDCLogoutUrl(client, { idToken: 'id-1', postLogoutRedirectUri: 'https://app.example.com/' })
		expect(captured.params).toEqual({ id_token_hint: 'id-1', post_logout_redirect_uri: 'https://app.example.com/' })
		expect(url).toBe('https://idp.example.com/logout?id_token_hint=id-1&post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2F')
	})

	test('omits absent optional params (no id_token / redirect)', () => {
		const { client, captured } = clientWith('https://idp.example.com/logout')
		const url = buildOIDCLogoutUrl(client, {})
		expect(captured.params).toEqual({})
		expect(url).toBe('https://idp.example.com/logout')
	})
})

/**
 * Direct coverage of the back-channel logout-token validation — the single trust gate on the public,
 * unauthenticated `/oidc/backchannel-logout` endpoint. Tokens are signed with a local `jose` keypair
 * whose public JWK is served (via a stubbed global `fetch`) as the IdP's JWKS, so each branch of the
 * verification is exercised end-to-end rather than mocked away.
 */
describe('validateOIDCLogoutToken', () => {
	type SigningKey = Awaited<ReturnType<typeof generateKeyPair>>['privateKey']

	const JWKS_URI = 'https://idp.logout-test.example.com/jwks'
	const ISS = 'https://idp.logout-test.example.com'
	const CLIENT_ID = 'client-123'
	const LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout'
	const KID = 'test-key-1'
	const KID_RS384 = 'test-key-384'

	let signingKey: SigningKey
	let otherSigningKey: SigningKey
	let rs384Key: SigningKey
	let realFetch: typeof globalThis.fetch

	const clientWithMeta = (meta: Record<string, unknown> = {}) =>
		({ metadata: { client_id: CLIENT_ID, id_token_signed_response_alg: 'RS256', ...meta } }) as any
	const issuerWithMeta = (meta: Record<string, unknown> = {}) => ({ metadata: { issuer: ISS, jwks_uri: JWKS_URI, ...meta } }) as any

	const validClaims = (): Record<string, unknown> => ({ iss: ISS, aud: CLIENT_ID, sid: 'sid-1', events: { [LOGOUT_EVENT]: {} } })

	const signToken = async (
		claims: Record<string, unknown>,
		opts: { alg?: string; kid?: string; key?: SigningKey; setIat?: boolean; iat?: number; setExp?: boolean } = {},
	): Promise<string> => {
		const { alg = 'RS256', kid = KID, key, setIat = true, iat, setExp = true } = opts
		let builder = new SignJWT(claims).setProtectedHeader({ alg, kid })
		if (setIat) {
			builder = builder.setIssuedAt(iat)
		}
		if (setExp) {
			builder = builder.setExpirationTime('1h')
		}
		return builder.sign(key ?? signingKey)
	}

	const validate = (token: string, client = clientWithMeta(), issuer = issuerWithMeta()) => validateOIDCLogoutToken(client, issuer, token)

	beforeAll(async () => {
		const keyPair = await generateKeyPair('RS256')
		signingKey = keyPair.privateKey
		otherSigningKey = (await generateKeyPair('RS256')).privateKey
		const rs384Pair = await generateKeyPair('RS384')
		rs384Key = rs384Pair.privateKey
		const jwk = await exportJWK(keyPair.publicKey)
		const rs384Jwk = await exportJWK(rs384Pair.publicKey)
		// The RS384 key resolves fine; the validator's algorithm pinning (algorithms: ['RS256']) is then
		// the *only* reason an RS384-signed token is rejected — so the alg-pinning test stays isolated.
		const jwks = {
			keys: [
				{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' },
				{ ...rs384Jwk, kid: KID_RS384, alg: 'RS384', use: 'sig' },
			],
		}

		realFetch = globalThis.fetch
		globalThis.fetch = (async (input: any) => {
			const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url
			if (typeof u === 'string' && u.startsWith(JWKS_URI)) {
				return new Response(JSON.stringify(jwks), { status: 200, headers: { 'content-type': 'application/json' } })
			}
			return realFetch(input)
		}) as typeof globalThis.fetch
	})

	afterAll(() => {
		globalThis.fetch = realFetch
	})

	test('accepts a well-formed logout token and extracts sid', async () => {
		expect(await validate(await signToken(validClaims()))).toEqual({ sid: 'sid-1', sub: undefined })
	})

	test('accepts a sub-only logout token and extracts sub', async () => {
		const token = await signToken({ iss: ISS, aud: CLIENT_ID, sub: 'user-1', events: { [LOGOUT_EVENT]: {} } })
		expect(await validate(token)).toEqual({ sid: undefined, sub: 'user-1' })
	})

	test('rejects a token signed by an unknown key (bad signature)', async () => {
		const token = await signToken(validClaims(), { key: otherSigningKey })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a wrong issuer', async () => {
		const token = await signToken({ ...validClaims(), iss: 'https://evil.example.com' })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a wrong audience (token-substitution guard)', async () => {
		const token = await signToken({ ...validClaims(), aud: 'some-other-client' })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects an algorithm other than the configured one (alg pinning)', async () => {
		const token = await signToken(validClaims(), { alg: 'RS384', kid: KID_RS384, key: rs384Key })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a token with no iat (replay-window guard)', async () => {
		const token = await signToken(validClaims(), { setIat: false })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a stale iat beyond the max age', async () => {
		const token = await signToken(validClaims(), { iat: Math.floor(Date.now() / 1000) - 600 })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a token with no exp', async () => {
		const token = await signToken(validClaims(), { setExp: false })
		await expect(validate(token)).rejects.toThrow(IDPValidationError)
	})

	test('rejects a token carrying a nonce (ID-token-replay guard)', async () => {
		const token = await signToken({ ...validClaims(), nonce: 'n-1' })
		await expect(validate(token)).rejects.toThrow(/nonce/)
	})

	test('rejects a token missing the back-channel-logout event member', async () => {
		const token = await signToken({ iss: ISS, aud: CLIENT_ID, sid: 'sid-1', events: {} })
		await expect(validate(token)).rejects.toThrow(/back-channel-logout event/)
	})

	test('rejects a token with neither sid nor sub', async () => {
		const token = await signToken({ iss: ISS, aud: CLIENT_ID, events: { [LOGOUT_EVENT]: {} } })
		await expect(validate(token)).rejects.toThrow(/sid or sub/)
	})

	test('rejects when the client has no client_id (aud check must fail closed)', async () => {
		const token = await signToken(validClaims())
		await expect(validate(token, clientWithMeta({ client_id: undefined }))).rejects.toThrow(/client_id/)
	})

	test('rejects when the issuer advertises no jwks_uri', async () => {
		const token = await signToken(validClaims())
		await expect(validate(token, clientWithMeta(), issuerWithMeta({ jwks_uri: undefined }))).rejects.toThrow(/jwks_uri/)
	})
})
