import { describe, expect, test } from 'bun:test'
import { errors } from 'openid-client'
import { revalidateOIDC, tokenSetToSessionState } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'
import { IDPSessionState } from '../../../../src/model/service/idp/index.js'

const session = (tokens: Record<string, unknown>, sessionId = 'sid-1'): IDPSessionState => ({ sessionId, tokens })

describe('revalidateOIDC — refresh', () => {
	test('valid: rotates the refresh token and returns fresh claims', async () => {
		const client = {
			refresh: async (token: string) => {
				expect(token).toBe('refresh-old')
				return {
					refresh_token: 'refresh-new',
					access_token: 'access-new',
					id_token: 'id-new',
					expires_at: 1_900_000_000,
					claims: () => ({ sub: 'user-1', email: 'a@b.cz' }),
				}
			},
		} as any

		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'refresh-old' }))

		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			// claims are normalized the SAME way sign-in normalizes them (identity fields mapped on top of the
			// raw claims), so an `always` mapping reconciles against an identical surface on refresh.
			expect(result.claims).toEqual({ sub: 'user-1', email: 'a@b.cz', externalIdentifier: 'user-1', emailVerified: false })
			// id_token present + surface rebuilt → complete, so the caller may run `unmatched: "remove"` here too.
			expect(result.claimsComplete).toBe(true)
			expect(result.idpSession?.tokens?.refresh_token).toBe('refresh-new')
			expect(result.idpSession?.sessionId).toBe('sid-1')
			expect(result.idpSession?.expiresAt).toEqual(new Date(1_900_000_000 * 1000))
		}
	})

	test('fetchUserInfo: merges userinfo into the refresh surface (same as sign-in)', async () => {
		// At sign-in, `fetchUserInfo` merges userinfo over the id-token claims; the refresh path does the SAME,
		// so a rule keyed on a userinfo-only claim (e.g. `groups`) resolves on refresh too.
		const client = {
			refresh: async () => ({
				refresh_token: 'refresh-new',
				access_token: 'access-new',
				id_token: 'id-new',
				claims: () => ({ sub: 'user-1', email: 'a@b.cz' }),
			}),
			userinfo: async (token: any) => {
				expect(token.access_token).toBe('access-new')
				return { sub: 'user-1', groups: ['IT-Admins'] }
			},
		} as any

		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'refresh-old' }), { fetchUserInfo: true })

		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			expect((result.claims as any)?.groups).toEqual(['IT-Admins'])
			expect((result.claims as any)?.email).toBe('a@b.cz')
			expect(result.claimsComplete).toBe(true)
		}
	})

	test('fetchUserInfo failure → keep session, skip the sync (no claims, surface not complete)', async () => {
		// The IdP already vouched for the session via the successful refresh; a failed userinfo fetch must not
		// fail revalidation. Drop the claims so the sync is skipped (and removal can never run off a half-built
		// surface) and retry on a later refresh.
		const client = {
			refresh: async () => ({
				refresh_token: 'refresh-new',
				access_token: 'access-new',
				id_token: 'id-new',
				claims: () => ({ sub: 'user-1' }),
			}),
			userinfo: async () => {
				throw new Error('userinfo unreachable')
			},
		} as any

		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'refresh-old' }), { fetchUserInfo: true })

		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			expect(result.claims).toBeUndefined()
			expect(result.claimsComplete).toBe(false)
			// the session is still kept (rotated token persisted)
			expect(result.idpSession?.tokens?.refresh_token).toBe('refresh-new')
		}
	})

	test('non-rotating IdP: refresh omits the refresh token → keep the stored one (no spurious revoke)', async () => {
		// RFC 6749 §6 — a refresh response MAY omit refresh_token; the client keeps the old one.
		const client = {
			refresh: async (token: string) => {
				expect(token).toBe('refresh-old')
				return {
					access_token: 'access-new',
					expires_at: 1_900_000_000,
					claims: () => ({ sub: 'user-1' }),
				}
			},
		} as any

		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'refresh-old', id_token: 'id-old' }))

		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			// preserved from the stored session, not lost
			expect(result.idpSession?.tokens?.refresh_token).toBe('refresh-old')
			expect(result.idpSession?.tokens?.id_token).toBe('id-old')
			expect(result.idpSession?.tokens?.access_token).toBe('access-new')
		}
	})

	test('revoked: no refresh token stored', async () => {
		const result = await revalidateOIDC({} as any, 'refresh', session({}))
		expect(result).toEqual({ status: 'revoked', reason: 'no_refresh_token' })
	})

	test('revoked: IdP rejects the grant (invalid_grant)', async () => {
		const client = {
			refresh: async () => {
				throw new errors.OPError({ error: 'invalid_grant' })
			},
		} as any
		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'x' }))
		expect(result).toEqual({ status: 'revoked', reason: 'invalid_grant' })
	})

	test('transient failure propagates (does NOT revoke)', async () => {
		const client = {
			refresh: async () => {
				throw new Error('ECONNREFUSED')
			},
		} as any
		await expect(revalidateOIDC(client, 'refresh', session({ refresh_token: 'x' }))).rejects.toThrow('ECONNREFUSED')
	})

	test('attributesKey: nested claims are lifted to the top level on the refresh path (same as sign-in)', async () => {
		// A09 (SEC-2): an `attributesKey` provider (e.g. Apereo CAS) nests its claims under `attributes`; the
		// `claimMapping` option wires that lift into `revalidateOIDC` so its mapping resolves identically on refresh.
		const client = {
			refresh: async () => ({
				refresh_token: 'refresh-new',
				id_token: 'id-new',
				claims: () => ({ sub: 'signed', attributes: { groups: ['IT-Admins'], sub: 'spoofed' } }),
			}),
		} as any

		const result = await revalidateOIDC(client, 'refresh', session({ refresh_token: 'refresh-old' }), { claimMapping: { attributesKey: 'attributes' } })

		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			// the nested `groups` is surfaced top-level for rule matching…
			expect((result.claims as any)?.groups).toEqual(['IT-Admins'])
			// …while a signed top-level claim keeps precedence over an attributes-level value of the same name
			expect((result.claims as any)?.sub).toBe('signed')
		}
	})
})

describe('revalidateOIDC — userinfo', () => {
	test('valid: returns userinfo claims', async () => {
		const client = {
			userinfo: async (token: string) => {
				expect(token).toBe('access-1')
				return { sub: 'user-1', groups: ['admins'] }
			},
		} as any
		const result = await revalidateOIDC(client, 'userinfo', session({ access_token: 'access-1' }))
		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			expect(result.claims).toEqual({ sub: 'user-1', groups: ['admins'], externalIdentifier: 'user-1', emailVerified: false })
			// userinfo carries no id-token claims → narrower than sign-in's surface → additive-only on refresh.
			expect(result.claimsComplete).toBe(false)
		}
	})

	test('attributesKey: userinfo nested claims are lifted to the top level', async () => {
		const client = {
			userinfo: async () => ({ sub: 'user-1', attributes: { groups: ['admins'] } }),
		} as any
		const result = await revalidateOIDC(client, 'userinfo', session({ access_token: 'access-1' }), { claimMapping: { attributesKey: 'attributes' } })
		expect(result.status).toBe('valid')
		if (result.status === 'valid') {
			expect((result.claims as any)?.groups).toEqual(['admins'])
		}
	})

	test('revoked: no access token', async () => {
		const result = await revalidateOIDC({} as any, 'userinfo', session({}))
		expect(result).toEqual({ status: 'revoked', reason: 'no_access_token' })
	})

	test('revoked: bare 401 with no parseable error code', async () => {
		// RFC 6750 allows a 401 without a `WWW-Authenticate` error param; openid-client then
		// surfaces a non-standard `error` string. A 401 is still definitive → revoked.
		const client = {
			userinfo: async () => {
				throw new errors.OPError({ error: 'expected 200 OK, got: 401 Unauthorized' }, { statusCode: 401 } as any)
			},
		} as any
		const result = await revalidateOIDC(client, 'userinfo', session({ access_token: 'a' }))
		expect(result).toEqual({ status: 'revoked', reason: 'userinfo_unauthorized' })
	})

	test('transient: a 503 from userinfo propagates (does NOT revoke)', async () => {
		const client = {
			userinfo: async () => {
				throw new errors.OPError({ error: 'expected 200 OK, got: 503 Service Unavailable' }, { statusCode: 503 } as any)
			},
		} as any
		await expect(revalidateOIDC(client, 'userinfo', session({ access_token: 'a' }))).rejects.toThrow()
	})
})

describe('revalidateOIDC — introspection', () => {
	test('valid when active', async () => {
		const client = { introspect: async () => ({ active: true }) } as any
		const result = await revalidateOIDC(client, 'introspection', session({ access_token: 'a' }))
		expect(result.status).toBe('valid')
	})

	test('revoked when inactive', async () => {
		const client = { introspect: async () => ({ active: false }) } as any
		const result = await revalidateOIDC(client, 'introspection', session({ access_token: 'a' }))
		expect(result).toEqual({ status: 'revoked', reason: 'inactive' })
	})

	test('a 401 from introspection is transient (client-auth/config), NOT a revoked token', async () => {
		// Introspection reports revoked tokens with 200 `{active:false}`; a 401 means the
		// client failed to authenticate to the introspection endpoint → must not log users out.
		const client = {
			introspect: async () => {
				throw new errors.OPError({ error: 'expected 200 OK, got: 401 Unauthorized' }, { statusCode: 401 } as any)
			},
		} as any
		await expect(revalidateOIDC(client, 'introspection', session({ access_token: 'a' }))).rejects.toThrow()
	})
})

describe('tokenSetToSessionState', () => {
	test('captures only present tokens and converts expiry to a Date', () => {
		const state = tokenSetToSessionState({ refresh_token: 'r', expires_at: 1000 } as any, 'sid-2')
		expect(state).toEqual({
			sessionId: 'sid-2',
			tokens: { refresh_token: 'r' },
			expiresAt: new Date(1000 * 1000),
		})
	})

	test('falls back to previous refresh/id tokens when the new token set omits them', () => {
		const state = tokenSetToSessionState(
			{ access_token: 'a-new', expires_at: 1000 } as any,
			'sid-3',
			{ refresh_token: 'r-old', id_token: 'i-old', access_token: 'a-old' },
		)
		expect(state.tokens).toEqual({ refresh_token: 'r-old', id_token: 'i-old', access_token: 'a-new' })
	})

	test('prefers the new tokens over the previous ones when both are present', () => {
		const state = tokenSetToSessionState(
			{ refresh_token: 'r-new', access_token: 'a-new' } as any,
			'sid-4',
			{ refresh_token: 'r-old' },
		)
		expect(state.tokens?.refresh_token).toBe('r-new')
	})
})
