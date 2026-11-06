import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import http from 'node:http'
import { createEgressGuard } from '@contember/engine-common'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'

/**
 * An IdP served from localhost whose discovery document points every endpoint at 127.0.0.1, so a guard that
 * allow-lists only `localhost` lets discovery through and must refuse each follow-up request.
 */
describe('OIDCProvider and the egress guard', () => {
	let server: http.Server
	let port: number
	const requested: string[] = []

	beforeAll(async () => {
		server = http.createServer((req, res) => {
			requested.push(req.url ?? '')
			req.resume()
			const base = `http://127.0.0.1:${port}`
			if (req.url === '/.well-known/openid-configuration') {
				res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
					issuer: `http://localhost:${port}`,
					authorization_endpoint: `${base}/authorize`,
					token_endpoint: `${base}/token`,
					jwks_uri: `${base}/jwks`,
				}))
				return
			}
			res.writeHead(404).end()
		})
		// All interfaces: `localhost` may resolve to ::1 first.
		await new Promise<void>(resolve => server.listen(0, resolve))
		const address = server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('expected a TCP address')
		}
		port = address.port
	})

	afterAll(() => {
		server.close()
	})

	const configuration = (): OIDCConfiguration => ({ url: `http://localhost:${port}`, clientId: 'client', clientSecret: 'secret' })
	const initData = { redirectUrl: 'https://app.example.com/callback' }

	test('without the guard (the default), discovery of a local IdP works', async () => {
		const result = await new OIDCProvider(null, null).initAuth(configuration(), initData)
		expect(result.authUrl).toStartWith(`http://127.0.0.1:${port}/authorize?`)
	})

	test('with the guard, discovery of a non-public IdP is refused', async () => {
		const before = requested.length
		const provider = new OIDCProvider(createEgressGuard({ guard: true, allowHttp: true }), null)
		await expect(provider.initAuth(configuration(), initData)).rejects.toThrow('non-public address')
		expect(requested.length).toBe(before)
	})

	describe('with the guard allowing only the discovery host', () => {
		const provider = new OIDCProvider(createEgressGuard({ guard: true, allowHttp: true, allowlist: ['localhost'] }), null)

		test('discovery passes', async () => {
			const result = await provider.initAuth(configuration(), initData)
			expect(result.authUrl).toStartWith(`http://127.0.0.1:${port}/authorize?`)
		})

		test('the token endpoint request is refused', async () => {
			const response = {
				url: `https://app.example.com/callback?code=abc&state=s1`,
				redirectUrl: initData.redirectUrl,
				sessionData: { state: 's1', nonce: 'n1' },
			}
			await expect(provider.processResponse(configuration(), response)).rejects.toThrow('non-public address')
			expect(requested).not.toContain('/token')
		})

		test('the JWKS request for a logout token is refused', async () => {
			await expect(provider.validateLogoutToken(configuration(), 'eyJhbGciOiJSUzI1NiJ9.eyJzaWQiOiJ4In0.c2ln')).rejects.toThrow('non-public address')
			expect(requested).not.toContain('/jwks')
		})
	})
})
