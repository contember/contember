import { describe, expect, test } from 'bun:test'
import { errors } from 'openid-client'
import { revalidateOIDC, tokenSetToSessionState } from '../../../../src/model/service/idp/providers/OIDCHelpers'
import { IDPSessionState } from '../../../../src/model/service/idp'

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
			expect(result.claims).toEqual({ sub: 'user-1', email: 'a@b.cz' })
			expect(result.idpSession?.tokens?.refresh_token).toBe('refresh-new')
			expect(result.idpSession?.sessionId).toBe('sid-1')
			expect(result.idpSession?.expiresAt).toEqual(new Date(1_900_000_000 * 1000))
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
			expect(result.claims).toEqual({ sub: 'user-1', groups: ['admins'] })
		}
	})

	test('revoked: no access token', async () => {
		const result = await revalidateOIDC({} as any, 'userinfo', session({}))
		expect(result).toEqual({ status: 'revoked', reason: 'no_access_token' })
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
})
