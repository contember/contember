import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { WorkloadIdentity } from '../../../../../src/index.js'
import { IssuerEgressPolicy } from '../../../../../src/model/service/workloadIdentity/verification/IssuerEgressPolicy.js'
import { WorkloadIssuerFetcher } from '../../../../../src/model/service/workloadIdentity/verification/WorkloadIssuerFetcher.js'
import { json, TestServer } from './testIssuer.js'

const config = (overrides: Partial<WorkloadIdentity.InstanceConfig> = {}): WorkloadIdentity.InstanceConfig => ({
	...WorkloadIdentity.defaultInstanceConfig,
	...overrides,
})

const fetchError = async (fetcher: WorkloadIssuerFetcher, url: string): Promise<string> => {
	try {
		await fetcher.fetchJson(url)
		return 'ok'
	} catch (e) {
		return e instanceof Error ? e.message : String(e)
	} finally {
		fetcher.dispose()
	}
}

describe('egress policy', () => {
	const policy = new IssuerEgressPolicy(config({ egressAllowlist: ['keycloak.internal', '10.20.0.0/16', 'fd00::/8'] }))
	const allowed = (host: string, address: string) => {
		try {
			policy.checkAddress(host, address)
			return true
		} catch {
			return false
		}
	}

	test.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.16.0.1',
		'192.168.1.1',
		'169.254.169.254',
		'100.64.0.1',
		'0.0.0.0',
		'224.0.0.1',
		'255.255.255.255',
		'::1',
		'::',
		'::ffff:127.0.0.1',
		'fe80::1',
		'fc00::1',
		'ff02::1',
		'2001:db8::1',
		'2002:7f00:1::1',
	])('the non-public address %s is rejected', address => {
		expect(allowed('issuer.example.com', address)).toBe(false)
	})

	test.each(['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'])('the public address %s is allowed', address => {
		expect(allowed('issuer.example.com', address)).toBe(true)
	})

	test('the egress allowlist exempts listed hosts and networks only', () => {
		expect(allowed('keycloak.internal', '10.0.0.5')).toBe(true)
		expect(allowed('KEYCLOAK.internal.', '10.0.0.5')).toBe(true)
		expect(allowed('other.internal', '10.20.5.5')).toBe(true)
		expect(allowed('other.internal', '10.21.5.5')).toBe(false)
		expect(allowed('other.internal', 'fd00::5')).toBe(true)
	})

	test('https is required unless the host is an insecure issuer', () => {
		expect(() => policy.checkUrl(new URL('http://issuer.example.com/'))).toThrow('Only https://')
		expect(() => new IssuerEgressPolicy(config({ insecureIssuers: ['localhost'] })).checkUrl(new URL('http://localhost:3000/'))).not.toThrow()
		expect(() => new IssuerEgressPolicy(config({ insecureIssuers: ['localhost'] })).checkUrl(new URL('http://127.0.0.1:3000/'))).toThrow(
			'Only https://',
		)
	})

	test('an IP-literal URL is checked without a lookup', () => {
		expect(() => policy.checkUrl(new URL('https://169.254.169.254/latest'))).toThrow('non-public')
		expect(() => policy.checkUrl(new URL('https://[::1]/'))).toThrow('non-public')
	})

	test('an invalid allowlist entry fails loudly', () => {
		expect(() => new IssuerEgressPolicy(config({ egressAllowlist: ['10.0.0.0/33'] }))).toThrow()
		expect(() => new IssuerEgressPolicy(config({ egressAllowlist: ['host/8'] }))).toThrow()
	})
})

describe('fetcher', () => {
	let server: TestServer

	beforeAll(async () => {
		server = await TestServer.start()
		server.handler = (req, res) => {
			const url = new URL(req.url ?? '/', 'http://localhost')
			const redirect = url.pathname.match(/^\/redirect\/(\d+)$/)
			if (redirect) {
				const remaining = Number(redirect[1])
				res.statusCode = 302
				res.setHeader('location', remaining === 0 ? '/doc' : `/redirect/${remaining - 1}`)
				res.end()
				return
			}
			if (url.pathname === '/to-other-host') {
				res.statusCode = 302
				res.setHeader('location', `http://127.0.0.1:${server.port}/doc`)
				res.end()
				return
			}
			if (url.pathname === '/doc') {
				json(res, { ok: true })
				return
			}
			if (url.pathname === '/big') {
				res.statusCode = 200
				res.write('[')
				res.end(`${'1,'.repeat(150 * 1024)}1]`)
				return
			}
			if (url.pathname === '/slow') {
				setTimeout(() => json(res, { ok: true }), 500)
				return
			}
			res.statusCode = 404
			res.end()
		}
	})

	afterAll(async () => {
		await server.stop()
	})

	const insecure = () => new WorkloadIssuerFetcher(config({ insecureIssuers: ['localhost'] }))

	test('an insecure issuer host is fetched over http', async () => {
		const fetcher = insecure()
		expect(await fetcher.fetchJson(`http://localhost:${server.port}/doc`)).toEqual({ ok: true })
		fetcher.dispose()
	})

	test('http is refused for any other host', async () => {
		expect(await fetchError(new WorkloadIssuerFetcher(config()), `http://localhost:${server.port}/doc`)).toContain('Only https://')
	})

	test('a host resolving to loopback is refused at connection time', async () => {
		const before = server.connections
		expect(await fetchError(new WorkloadIssuerFetcher(config()), `https://localhost:${server.port}/doc`)).toContain('non-public address')
		expect(server.connections).toBe(before)
	})

	test('the egress allowlist lets the connection through, by hostname or by network', async () => {
		// By network with an IP literal: `localhost` may also resolve to ::1, which the network does not cover.
		const cases: { allowlist: string[]; host: string }[] = [{ allowlist: ['localhost'], host: 'localhost' }, {
			allowlist: ['127.0.0.0/8'],
			host: '127.0.0.1',
		}]
		for (const { allowlist, host } of cases) {
			const before = server.connections
			// The test server speaks plain http, so TLS fails — but only after the connection was allowed.
			const message = await fetchError(new WorkloadIssuerFetcher(config({ egressAllowlist: allowlist })), `https://${host}:${server.port}/doc`)
			expect(message).not.toContain('non-public')
			expect(server.connections).toBe(before + 1)
		}
	})

	test('at most three redirects are followed', async () => {
		const fetcher = insecure()
		expect(await fetcher.fetchJson(`http://localhost:${server.port}/redirect/2`)).toEqual({ ok: true })
		expect(await fetchError(fetcher, `http://localhost:${server.port}/redirect/3`)).toContain('Too many redirects')
	})

	test('every redirect target is re-validated', async () => {
		expect(await fetchError(insecure(), `http://localhost:${server.port}/to-other-host`)).toContain('Only https://')
	})

	test('a response over the size cap is refused', async () => {
		expect(await fetchError(insecure(), `http://localhost:${server.port}/big`)).toContain('exceeds 262144 bytes')
	})

	test('a slow response times out', async () => {
		const fetcher = new WorkloadIssuerFetcher(config({ insecureIssuers: ['localhost'] }), { timeoutMs: 100, maxResponseBytes: 1024, maxRedirects: 3 })
		expect(await fetchError(fetcher, `http://localhost:${server.port}/slow`)).toContain('Timed out')
	})

	test('a non-200 response is refused', async () => {
		expect(await fetchError(insecure(), `http://localhost:${server.port}/missing`)).toContain('HTTP 404')
	})
})
