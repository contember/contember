import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { IDPSessionState } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp } from './FakeIdp.js'
import { authUrlParameters, configurationFor, signIn } from './harness.js'

/** Pins the IdP session captured at sign-in and what a successful revalidation stores back. */
describe('OIDC session capture and revalidation', () => {
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

	const refreshConfiguration = (overrides: Partial<OIDCConfiguration> = {}) => configurationFor(idp, { revalidation: { enabled: true }, ...overrides })

	const capture = async (configuration: OIDCConfiguration) => {
		const provider = new OIDCProvider(null, null)
		const run = await signIn(provider, configuration, idp)
		return { provider, ...run, session: run.response.idpSession ?? {} }
	}

	describe('at sign-in', () => {
		test('without revalidation nothing is captured and offline_access is not requested', async () => {
			const { init, response } = await capture(configurationFor(idp))

			expect(authUrlParameters(init.authUrl).scope).toBe('openid email')
			expect(response.idpSession).toBeUndefined()
		})

		test('refresh revalidation requests offline_access and stores the tokens, the sid and the expiry', async () => {
			const before = Date.now()
			const { init, session } = await capture(refreshConfiguration())

			expect(authUrlParameters(init.authUrl).scope).toBe('openid email offline_access')
			expect(session).toEqual({
				sessionId: 'idp-session-1',
				tokens: { refresh_token: expect.stringMatching(/^refresh-/), access_token: expect.stringMatching(/^access-/), id_token: expect.any(String) },
				expiresAt: expect.any(Date),
			})
			// expires_in 300 → an absolute expiry, whole seconds
			const expiresAt = session.expiresAt?.getTime() ?? 0
			expect(expiresAt).toBeGreaterThanOrEqual(Math.floor(before / 1000) * 1000 + 300_000)
			expect(expiresAt).toBeLessThanOrEqual(Date.now() + 300_000)
		})

		test('offline_access already in the scope is not added twice', async () => {
			const { init } = await capture(refreshConfiguration({ scope: 'openid offline_access email' }))

			expect(authUrlParameters(init.authUrl).scope).toBe('openid offline_access email')
		})

		test('userinfo revalidation captures the session without offline_access', async () => {
			const { init, session } = await capture(refreshConfiguration({ revalidation: { enabled: true, method: 'userinfo' } }))

			expect(authUrlParameters(init.authUrl).scope).toBe('openid email')
			expect(Object.keys(session.tokens ?? {}).sort()).toEqual(['access_token', 'id_token'])
		})

		test('an ID token without sid stores no session id', async () => {
			idp.sessionId = undefined

			const { session } = await capture(refreshConfiguration())

			expect(session.sessionId).toBeUndefined()
		})

		test('returnOIDCResult spreads the token set into the response', async () => {
			const { response } = await capture(configurationFor(idp, { returnOIDCResult: true }))

			expect(response).toMatchObject({
				access_token: expect.stringMatching(/^access-/),
				token_type: 'Bearer',
				id_token: expect.any(String),
				scope: 'openid email',
				expires_at: expect.any(Number),
				externalIdentifier: 'user-1',
			})
		})
	})

	describe('refresh', () => {
		const tokensOf = (session: IDPSessionState | undefined) => session?.tokens ?? {}

		test('a rotating IdP: the new tokens are stored, the claims rebuilt as at sign-in', async () => {
			const { provider, session } = await capture(refreshConfiguration())
			idp.requests.length = 0

			const result = await provider.revalidate(refreshConfiguration(), session)

			const tokenRequest = idp.requestsTo('token')[0]
			expect(tokenRequest.form).toEqual({ grant_type: 'refresh_token', refresh_token: String(tokensOf(session).refresh_token) })
			expect(result).toEqual({
				status: 'valid',
				claims: {
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
					at_hash: expect.any(String),
					externalIdentifier: 'user-1',
					emailVerified: true,
				},
				claimsComplete: true,
				idpSession: {
					sessionId: 'idp-session-1',
					tokens: { refresh_token: expect.stringMatching(/^refresh-/), access_token: expect.stringMatching(/^access-/), id_token: expect.any(String) },
					expiresAt: expect.any(Date),
				},
			})
			if (result.status === 'valid') {
				expect(tokensOf(result.idpSession).refresh_token).not.toBe(tokensOf(session).refresh_token)
			}
		})

		test('a non-rotating IdP: the stored refresh token is carried forward', async () => {
			const { provider, session } = await capture(refreshConfiguration())
			idp.rotateRefreshTokens = false

			const result = await provider.revalidate(refreshConfiguration(), session)

			expect(result.status === 'valid' && tokensOf(result.idpSession).refresh_token).toBe(tokensOf(session).refresh_token)
		})

		test('a refresh without an ID token: valid, no claims, the stored ID token carried forward', async () => {
			const { provider, session } = await capture(refreshConfiguration())
			idp.idTokenOnRefresh = false

			const result = await provider.revalidate(refreshConfiguration(), session)

			expect(result).toMatchObject({ status: 'valid', claims: undefined, claimsComplete: false })
			expect(result.status === 'valid' && tokensOf(result.idpSession).id_token).toBe(tokensOf(session).id_token)
		})

		test('fetchUserInfo: userinfo claims are merged over the refreshed ID token claims', async () => {
			const configuration = refreshConfiguration({ fetchUserInfo: true })
			const { provider, session } = await capture(configuration)
			idp.userinfoClaims = { groups: ['admins'], name: 'Jane Q. Doe' }

			const result = await provider.revalidate(configuration, session)

			expect(result).toMatchObject({ status: 'valid', claimsComplete: true, claims: { groups: ['admins'], name: 'Jane Q. Doe' } })
		})

		test('userinfo unreachable after a successful refresh: valid, the claim sync skipped', async () => {
			const configuration = refreshConfiguration({ fetchUserInfo: true })
			const { provider, session } = await capture(configuration)
			idp.override('userinfo', { kind: 'respond', status: 500, body: 'boom' })

			const result = await provider.revalidate(configuration, session)

			expect(result).toMatchObject({ status: 'valid', claims: undefined, claimsComplete: false })
		})
	})

	test('userinfo revalidation: valid with the normalized userinfo claims, never complete', async () => {
		const configuration = refreshConfiguration({ revalidation: { enabled: true, method: 'userinfo' } })
		const { provider, session } = await capture(configuration)
		idp.userinfoClaims = { groups: ['admins'] }

		const result = await provider.revalidate(configuration, session)

		expect(result).toEqual({
			status: 'valid',
			claims: {
				sub: 'user-1',
				email: 'jane@example.com',
				email_verified: true,
				name: 'Jane Doe',
				groups: ['admins'],
				externalIdentifier: 'user-1',
				emailVerified: true,
			},
			claimsComplete: false,
		})
		expect(idp.requestsTo('userinfo').at(-1)?.headers.authorization).toBe(`Bearer ${String(session.tokens?.access_token)}`)
	})
})
