import { expect, test } from 'bun:test'
import { OidcBackchannelLogoutMiddlewareFactory } from '../../../src/tenant/OidcBackchannelLogoutMiddlewareFactory.js'
import { HttpContext } from '../../../src/application/index.js'

type LogoutResult = Awaited<ReturnType<any>>

const createContext = (opts: {
	method?: string
	provider?: string | null
	body?: unknown
	logout?: (db: unknown, slug: string, token: string) => Promise<LogoutResult>
}) => {
	const responseHeaders: Record<string, string> = {}
	const calls: { slug: string; token: string }[] = []
	const url = new URL('http://localhost/oidc/backchannel-logout')
	if (opts.provider) {
		url.searchParams.set('provider', opts.provider)
	}
	const ctx = {
		url,
		koa: {
			request: {
				method: opts.method ?? 'POST',
				body: opts.body,
			},
			response: {
				set: (name: string, value: string) => {
					responseHeaders[name.toLowerCase()] = value
				},
			},
		},
		projectGroup: {
			tenantContainer: {
				databaseContext: {},
				backchannelLogoutManager: {
					logout: async (db: unknown, slug: string, token: string) => {
						calls.push({ slug, token })
						return opts.logout
							? await opts.logout(db, slug, token)
							: { status: 'ok', revokedCount: 1 }
					},
				},
			},
		},
	} as unknown as HttpContext
	return { ctx, responseHeaders, calls }
}

const controller = new OidcBackchannelLogoutMiddlewareFactory().create()

test('valid logout token → 200 and revokes via the manager', async () => {
	const { ctx, responseHeaders, calls } = createContext({
		provider: 'corp',
		body: { logout_token: 'TOKEN-123' },
		logout: async () => ({ status: 'ok', revokedCount: 2 }),
	})
	const response = await controller(ctx)
	expect(response?.code).toBe(200)
	expect(JSON.parse(response?.body as string)).toEqual({ ok: true, revoked: 2 })
	expect(responseHeaders['cache-control']).toBe('no-store')
	expect(calls).toEqual([{ slug: 'corp', token: 'TOKEN-123' }])
})

test('non-POST method → 405, manager not called', async () => {
	const { ctx, calls } = createContext({ method: 'GET', provider: 'corp', body: { logout_token: 'x' } })
	const response = await controller(ctx)
	expect(response?.code).toBe(405)
	expect(calls).toHaveLength(0)
})

test('missing provider query param → 400', async () => {
	const { ctx, calls } = createContext({ provider: null, body: { logout_token: 'x' } })
	const response = await controller(ctx)
	expect(response?.code).toBe(400)
	expect(calls).toHaveLength(0)
})

test('missing logout_token → 400', async () => {
	const { ctx, calls } = createContext({ provider: 'corp', body: {} })
	const response = await controller(ctx)
	expect(response?.code).toBe(400)
	expect(calls).toHaveLength(0)
})

test('invalid token (manager rejects) → 400', async () => {
	const { ctx } = createContext({
		provider: 'corp',
		body: { logout_token: 'bad' },
		logout: async () => ({ status: 'invalid_token', message: 'bad signature' }),
	})
	const response = await controller(ctx)
	expect(response?.code).toBe(400)
})

test('unknown provider → 404', async () => {
	const { ctx } = createContext({
		provider: 'nope',
		body: { logout_token: 'x' },
		logout: async () => ({ status: 'provider_not_found' }),
	})
	const response = await controller(ctx)
	expect(response?.code).toBe(404)
})

test('provider without back-channel support → 501', async () => {
	const { ctx } = createContext({
		provider: 'legacy',
		body: { logout_token: 'x' },
		logout: async () => ({ status: 'not_supported' }),
	})
	const response = await controller(ctx)
	expect(response?.code).toBe(501)
})
