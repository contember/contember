import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { FlattenedJWSInput, JWTHeaderParameters } from 'jose'
import {
	WorkloadJwksRegistry,
	WorkloadJwksUnavailableError,
	WorkloadKeySource,
} from '../../../../../src/model/service/workloadIdentity/verification/WorkloadJwksRegistry.js'
import { createIssuerKey, instanceConfig, json, TestIssuer } from './testIssuer.js'

const MAX_STALENESS = 3600

let issuer: TestIssuer
let now: number
let failures: number
let unknownKids: number
let registry: WorkloadJwksRegistry

beforeEach(async () => {
	issuer = await TestIssuer.start()
	now = 1_000_000
	failures = 0
	unknownKids = 0
	registry = new WorkloadJwksRegistry({ ...instanceConfig, jwksMaxStalenessSeconds: MAX_STALENESS }, {
		now: () => now,
		refreshIntervalSeconds: 3600,
		fetchCooldownSeconds: 30,
		metrics: { verification: () => {}, jwksFetchFailure: () => failures++, unknownKid: () => unknownKids++ },
	})
})

afterEach(async () => {
	registry.dispose()
	await issuer.stop()
})

const header = (kid: string): JWTHeaderParameters => ({ alg: 'RS256', kid })
const token: FlattenedJWSInput = { payload: '', signature: '' }

const resolve = async (kid: string, source: WorkloadKeySource = { issuer: issuer.issuer, jwksUri: null }) => {
	try {
		await registry.getKeyResolver(source)(header(kid), token)
		return 'ok'
	} catch (e) {
		return e instanceof WorkloadJwksUnavailableError ? 'unavailable' : e instanceof Error ? e.constructor.name : 'error'
	}
}

describe('stale-if-error', () => {
	test('last-known-good keys stay usable within the staleness bound while the issuer is down', async () => {
		expect(await resolve('key-1')).toBe('ok')
		issuer.available = false
		now += 120_000
		// an unknown kid forces a refetch, which fails
		expect(await resolve('key-2')).toBe('unavailable')
		expect(failures).toBe(1)
		expect(unknownKids).toBe(1)
		now += (MAX_STALENESS - 200) * 1000
		expect(await resolve('key-1')).toBe('ok')
	})

	test('beyond the bound the keys fail closed until the issuer is back', async () => {
		expect(await resolve('key-1')).toBe('ok')
		issuer.available = false
		now += MAX_STALENESS * 1000
		expect(await resolve('key-1')).toBe('unavailable')
		issuer.available = true
		// within the cooldown after a failure, no refetch is attempted
		now += 10_000
		expect(await resolve('key-1')).toBe('unavailable')
		now += 30_000
		expect(await resolve('key-1')).toBe('ok')
	})
})

describe('fetch policy', () => {
	test('unknown-kid refetches are rate limited per key source', async () => {
		expect(await resolve('key-1')).toBe('ok')
		const requests = issuer.jwksRequests
		now += 60_000
		expect(await resolve('rotated')).toBe('JWKSNoMatchingKey')
		expect(issuer.jwksRequests).toBe(requests + 1)
		expect(await resolve('rotated')).toBe('JWKSNoMatchingKey')
		expect(issuer.jwksRequests).toBe(requests + 1)
		expect(unknownKids).toBe(2)
	})

	test('a rotated key is picked up by the unknown-kid refetch', async () => {
		expect(await resolve('key-1')).toBe('ok')
		issuer.keys = [...issuer.keys, await createIssuerKey('key-2')]
		now += 60_000
		expect(await resolve('key-2')).toBe('ok')
	})

	test('the discovery issuer must equal the configured issuer exactly', async () => {
		const handler = issuer.server.handler
		issuer.server.handler = (req, res) => {
			if (req.url === '/.well-known/openid-configuration') {
				json(res, { issuer: `${issuer.issuer}/`, jwks_uri: `${issuer.issuer}/jwks.json` })
				return
			}
			handler(req, res)
		}
		expect(await resolve('key-1')).toBe('unavailable')
	})

	test('a configured jwksUri skips discovery', async () => {
		issuer.server.handler = (req, res) => {
			if (req.url === '/keys') {
				json(res, { keys: issuer.keys.map(it => it.publicJwk) })
				return
			}
			res.statusCode = 404
			res.end()
		}
		expect(await resolve('key-1', { issuer: 'https://issuer.invalid', jwksUri: `${issuer.issuer}/keys` })).toBe('ok')
	})

	test('a key set over the key-count cap is refused', async () => {
		const key = issuer.keys[0]
		issuer.keys = Array.from(
			{ length: 51 },
			(_, i) => ({ ...key, kid: i === 0 ? 'key-1' : `key-${i + 1}`, publicJwk: { ...key.publicJwk, kid: `key-${i + 1}` } }),
		)
		expect(await resolve('key-1')).toBe('unavailable')
	})

	test('private members of a published key are dropped', async () => {
		const key = issuer.keys[0]
		issuer.server.handler = (req, res) => {
			if (req.url === '/keys') {
				json(res, { keys: [{ ...key.publicJwk, d: 'AAAA', p: 'AAAA', q: 'AAAA' }] })
				return
			}
			res.statusCode = 404
			res.end()
		}
		expect(await resolve('key-1', { issuer: issuer.issuer, jwksUri: `${issuer.issuer}/keys` })).toBe('ok')
	})

	test('prewarm fetches ahead of the first request', async () => {
		await registry.prewarm([{ issuer: issuer.issuer, jwksUri: null }])
		expect(issuer.jwksRequests).toBe(1)
		issuer.available = false
		expect(await resolve('key-1')).toBe('ok')
	})
})
