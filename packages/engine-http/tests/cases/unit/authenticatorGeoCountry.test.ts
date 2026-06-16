import { expect, test } from 'bun:test'
import { IncomingMessage } from 'node:http'
import { Authenticator } from '../../../src/common/Authorizator.js'
import type { ApiKeyManager, DatabaseContext } from '@contember/engine-tenant-api'

// Minimal stub of ApiKeyManager.verifyAndProlong. `trust` controls whether the
// resolved api key trusts forwarded client info — the gate A03 reuses for geo.
const makeAuthenticator = (trust: boolean, geoHeader?: string) => {
	const apiKeyManager = {
		verifyAndProlong: async () => ({
			ok: true,
			result: {
				valid: true,
				identityId: 'identity-1',
				apiKeyId: 'api-key-1',
				roles: [],
				personId: null,
				trustForwardedInfo: trust,
			},
		}),
	} as unknown as ApiKeyManager
	const db = {} as DatabaseContext
	return new Authenticator(db, db, apiKeyManager, geoHeader)
}

const req = (headers: Record<string, string>): IncomingMessage => ({
	socket: { remoteAddress: '127.0.0.1' },
	headers: { authorization: 'Bearer abcdef0123456789', ...headers },
} as unknown as IncomingMessage)

const timer = (async (_name: string, cb: () => any) => await cb()) as any

test('geo header is read and exposed when the key trusts forwarded info', async () => {
	const auth = makeAuthenticator(true, 'X-Contember-Client-Geo-Country')
	const result = await auth.authenticate({
		request: req({ 'x-contember-client-ip': '203.0.113.9', 'x-contember-client-geo-country': 'US' }),
		timer,
		clientIp: '127.0.0.1',
	})
	expect(result?.geoCountry).toBe('US')
})

test('geo header is IGNORED when the key does not trust forwarded info (anti-spoof)', async () => {
	const auth = makeAuthenticator(false, 'X-Contember-Client-Geo-Country')
	const result = await auth.authenticate({
		request: req({ 'x-contember-client-geo-country': 'US' }),
		timer,
		clientIp: '127.0.0.1',
	})
	expect(result?.geoCountry).toBeUndefined()
})

test('geo header is IGNORED when no header name is configured (feature off by default)', async () => {
	const auth = makeAuthenticator(true, undefined)
	const result = await auth.authenticate({
		request: req({ 'x-contember-client-geo-country': 'US' }),
		timer,
		clientIp: '127.0.0.1',
	})
	expect(result?.geoCountry).toBeUndefined()
})

test('geo header is IGNORED when no client info was forwarded (avoids real-country vs proxy-IP mismatch)', async () => {
	// A trusted key that forwards ONLY the geo header (no client IP/UA) must not get
	// a trusted country: clientIp would fall back to the proxy socket, so scoring a
	// real country against a proxy IP mixes baselines. Geo rides the same gate as the
	// forwarded IP/UA — present only when client info was actually forwarded.
	const auth = makeAuthenticator(true, 'x-geo')
	const result = await auth.authenticate({ request: req({ 'x-geo': 'US' }), timer, clientIp: '127.0.0.1' })
	expect(result?.geoCountry).toBeUndefined()
})

// A forwarded client IP marks the request as carrying trusted forwarded info, the
// gate the geo signal rides on; the parsing tests below pair it with the geo header.
const forwardedIp = { 'x-contember-client-ip': '203.0.113.9' }

test('header lookup is case-insensitive in the configured name', async () => {
	const auth = makeAuthenticator(true, 'X-GEO')
	const result = await auth.authenticate({
		request: req({ ...forwardedIp, 'x-geo': 'DE' }),
		timer,
		clientIp: '127.0.0.1',
	})
	expect(result?.geoCountry).toBe('DE')
})

test('whitespace is trimmed and an empty value yields no country', async () => {
	const auth = makeAuthenticator(true, 'x-geo')
	const trimmed = await auth.authenticate({ request: req({ ...forwardedIp, 'x-geo': '  CZ  ' }), timer, clientIp: '127.0.0.1' })
	expect(trimmed?.geoCountry).toBe('CZ')
	const empty = await auth.authenticate({ request: req({ ...forwardedIp, 'x-geo': '   ' }), timer, clientIp: '127.0.0.1' })
	expect(empty?.geoCountry).toBeUndefined()
})

test('an overlong value is capped at the boundary', async () => {
	const auth = makeAuthenticator(true, 'x-geo')
	const long = 'A'.repeat(200)
	const result = await auth.authenticate({ request: req({ ...forwardedIp, 'x-geo': long }), timer, clientIp: '127.0.0.1' })
	expect(result?.geoCountry?.length).toBe(64)
})
