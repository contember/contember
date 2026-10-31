import { describe, expect, test } from 'bun:test'
import { createLocalJWKSet, decodeJwt, decodeProtectedHeader, exportJWK, generateKeyPair, JSONWebKeySet, jwtVerify } from 'jose'
import { get } from 'node:http'
import { issuerHandler } from '../../../src/index.js'
import { createTestIssuer } from '../../../src/testing.js'

/** Over `node:http`: the test preload replaces the global `fetch` with happy-dom's, which enforces CORS. */
const getJson = (url: string) =>
	new Promise<unknown>((resolve, reject) => {
		get(url, response => {
			let body = ''
			response.setEncoding('utf8')
			response.on('data', (chunk: string) => body += chunk)
			response.on('end', () => {
				try {
					resolve(JSON.parse(body))
				} catch (e) {
					reject(e)
				}
			})
		}).on('error', reject)
	})

const fetchJwks = async (jwksUri: string) => {
	const jwks: unknown = await getJson(jwksUri)
	if (typeof jwks !== 'object' || jwks === null || !('keys' in jwks) || !Array.isArray(jwks.keys)) {
		throw new Error('invalid JWKS')
	}
	const keySet: JSONWebKeySet = { keys: jwks.keys }
	return createLocalJWKSet(keySet)
}

const createPublicJwk = async () => {
	const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })
	return {
		publicJwk: { ...await exportJWK(publicKey), kid: 'key-1', alg: 'ES256' },
		privateJwk: { ...await exportJWK(privateKey), kid: 'key-1', alg: 'ES256' },
	}
}

describe('issuerHandler', () => {
	test('serves discovery and JWKS under the issuer path', async () => {
		const { publicJwk } = await createPublicJwk()
		const handler = issuerHandler({ issuer: 'https://auth.example.com/tenant-a', keys: [publicJwk] })

		const discovery = await handler(new Request('https://auth.example.com/tenant-a/.well-known/openid-configuration'))
		expect(discovery.status).toBe(200)
		expect(discovery.headers.get('Content-Type')).toBe('application/json')
		expect(discovery.headers.get('Cache-Control')).toBe('public, max-age=300')
		expect(await discovery.json()).toEqual({
			issuer: 'https://auth.example.com/tenant-a',
			jwks_uri: 'https://auth.example.com/tenant-a/.well-known/jwks.json',
			response_types_supported: ['id_token'],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['ES256'],
		})

		const jwks = await handler(new Request('https://auth.example.com/tenant-a/.well-known/jwks.json'))
		expect(jwks.status).toBe(200)
		expect(jwks.headers.get('Cache-Control')).toBe('public, max-age=300')
		expect(await jwks.json()).toEqual({ keys: [publicJwk] })

		const head = await handler(new Request('https://auth.example.com/tenant-a/.well-known/jwks.json', { method: 'HEAD' }))
		expect(head.status).toBe(200)
		expect(await head.text()).toBe('')
	})

	test('answers 404 elsewhere and 405 for other methods', async () => {
		const { publicJwk } = await createPublicJwk()
		const handler = issuerHandler({ issuer: 'https://auth.example.com', keys: [publicJwk] })

		expect((await handler(new Request('https://auth.example.com/'))).status).toBe(404)
		expect((await handler(new Request('https://auth.example.com/other/.well-known/jwks.json'))).status).toBe(404)
		expect((await handler(new Request('https://auth.example.com/.well-known/jwks.json', { method: 'POST' }))).status).toBe(405)
	})

	test('rejects keys with private members and keys without kid / alg', async () => {
		const { publicJwk, privateJwk } = await createPublicJwk()
		expect(() => issuerHandler({ issuer: 'https://auth.example.com', keys: [publicJwk, privateJwk] })).toThrow('private members (d)')
		for (const member of ['p', 'q', 'dp', 'dq', 'qi', 'k']) {
			expect(() => issuerHandler({ issuer: 'https://auth.example.com', keys: [{ ...publicJwk, [member]: 'secret' }] })).toThrow(
				`private members (${member})`,
			)
		}
		expect(() => issuerHandler({ issuer: 'https://auth.example.com', keys: [{ ...publicJwk, alg: undefined }] })).toThrow('`kid` and `alg`')
		const { kid, ...withoutKid } = publicJwk
		expect(kid).toBe('key-1')
		expect(() => issuerHandler({ issuer: 'https://auth.example.com', keys: [withoutKid] })).toThrow('`kid` and `alg`')
	})

	test('rejects an issuer with a query or a non-http scheme', async () => {
		const { publicJwk } = await createPublicJwk()
		expect(() => issuerHandler({ issuer: 'https://auth.example.com/?tenant=a', keys: [publicJwk] })).toThrow('without query')
		expect(() => issuerHandler({ issuer: 'ftp://auth.example.com', keys: [publicJwk] })).toThrow('http(s)')
	})
})

describe('createTestIssuer', () => {
	for (const alg of ['RS256', 'ES256'] as const) {
		test(`discovery, JWKS and minted tokens verify end to end (${alg})`, async () => {
			const testIssuer = await createTestIssuer({ alg })
			try {
				expect(testIssuer.issuer).toMatch(/^http:\/\/localhost:\d+$/)
				const config = await getJson(`${testIssuer.issuer}/.well-known/openid-configuration`)
				expect(config).toMatchObject({ issuer: testIssuer.issuer, jwks_uri: testIssuer.jwksUri, id_token_signing_alg_values_supported: [alg] })

				const jwks = await fetchJwks(testIssuer.jwksUri)
				const now = Math.floor(Date.now() / 1000)
				const claims = { iss: testIssuer.issuer, sub: 'job', aud: 'contember:test', iat: now, exp: now + 60 }
				const token = await testIssuer.mint(claims)
				const { payload, protectedHeader } = await jwtVerify(token, jwks, { issuer: testIssuer.issuer, audience: 'contember:test', typ: 'JWT' })
				expect(payload).toEqual(claims)
				expect(protectedHeader.alg).toBe(alg)

				const provider = testIssuer.credentials({ subject: 'web-backend', audience: 'contember:test' })
				const [, providedToken] = (await provider.authenticate({ url: 'https://api.example.com/', method: 'POST', refresh: false })).Authorization.split(
					' ',
				)
				expect((await jwtVerify(providedToken, jwks, { issuer: testIssuer.issuer, audience: 'contember:test' })).payload.sub).toBe('web-backend')
			} finally {
				await testIssuer.close()
			}
		})
	}

	test('mints exactly the given claims, with header overrides and a foreign key', async () => {
		const testIssuer = await createTestIssuer({ hostname: '127.0.0.1' })
		try {
			expect(testIssuer.issuer).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
			const jwks = await fetchJwks(testIssuer.jwksUri)

			const expiredClaims = { iss: testIssuer.issuer, aud: ['a', 'b'], exp: 1 }
			const expired = await testIssuer.mint(expiredClaims)
			const decoded: Record<string, unknown> = decodeJwt(expired)
			expect(decoded).toEqual(expiredClaims)

			const untyped = await testIssuer.mint({ sub: 'x' }, { header: { typ: undefined, extra: 'h' } })
			const header = decodeProtectedHeader(untyped)
			expect(header.typ).toBeUndefined()
			expect(header.extra).toBe('h')
			expect((await jwtVerify(untyped, jwks)).payload).toEqual({ sub: 'x' })

			const foreign = await testIssuer.mint({ sub: 'x' }, { foreignKey: true })
			expect(decodeProtectedHeader(foreign).kid).toBe(header.kid)
			await expect(jwtVerify(foreign, jwks)).rejects.toThrow('signature verification failed')
		} finally {
			await testIssuer.close()
		}
	})
})
