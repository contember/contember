import { expect, test } from 'bun:test'
import { readConfig } from '../../../src/config/config.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { createMigrationLockOptions } from '../../../src/system/migrationLockOptions.js'

const trustedProxies = (val: unknown): unknown => serverConfigSchema({ http: { trustedProxies: val } }).http?.trustedProxies

test('trustedProxies: undefined when absent', () => {
	expect(serverConfigSchema({}).http?.trustedProxies).toBeUndefined()
})

test('trustedProxies: empty string yields undefined', () => {
	expect(trustedProxies('')).toBeUndefined()
})

test('trustedProxies: single CIDR', () => {
	expect(trustedProxies('10.0.0.0/8')).toStrictEqual(['10.0.0.0/8'])
})

test('trustedProxies: comma-separated list is split and trimmed', () => {
	expect(trustedProxies('10.0.0.0/8, 192.168.0.0/16 ,  172.16.0.0/12')).toStrictEqual([
		'10.0.0.0/8',
		'192.168.0.0/16',
		'172.16.0.0/12',
	])
})

test('trustedProxies: array input is accepted', () => {
	expect(trustedProxies(['10.0.0.0/8', '::1/128'])).toStrictEqual(['10.0.0.0/8', '::1/128'])
})

test('trustedProxies: bare IPv4 is normalized to /32', () => {
	expect(trustedProxies('203.0.113.1')).toStrictEqual(['203.0.113.1/32'])
})

test('trustedProxies: bare IPv6 is normalized to /128', () => {
	expect(trustedProxies('::1')).toStrictEqual(['::1/128'])
})

test('trustedProxies: mixed bare and CIDR entries', () => {
	expect(trustedProxies('203.0.113.1, 10.0.0.0/8')).toStrictEqual(['203.0.113.1/32', '10.0.0.0/8'])
})

test('trustedProxies: invalid CIDR throws (fail-fast on misconfiguration)', () => {
	expect(() => trustedProxies('not-an-ip')).toThrow()
})

test('trustedProxies: invalid prefixed entry throws', () => {
	expect(() => trustedProxies('10.0.0.0/999')).toThrow()
})

// A03: the trusted reverse-proxy geo-country header name. Same bar as trustedProxies
// since it gates a trust-boundary signal: undefined when unset, string passthrough,
// fail-fast on a non-string value.
const geoCountryHeader = (val: unknown): unknown => serverConfigSchema({ http: { geoCountryHeader: val } }).http?.geoCountryHeader

test('geoCountryHeader: undefined when absent (feature off by default)', () => {
	expect(serverConfigSchema({}).http?.geoCountryHeader).toBeUndefined()
})

test('geoCountryHeader: empty string yields undefined', () => {
	expect(geoCountryHeader('')).toBeUndefined()
})

test('geoCountryHeader: a string passes through unchanged', () => {
	expect(geoCountryHeader('X-Contember-Client-Geo-Country')).toBe('X-Contember-Client-Geo-Country')
})

test('geoCountryHeader: a non-string value throws (fail-fast on misconfiguration)', () => {
	expect(() => geoCountryHeader(123)).toThrow()
	expect(() => geoCountryHeader({})).toThrow()
})

test('shutdownDelayMs: read from CONTEMBER_SHUTDOWN_DELAY_MS', async () => {
	process.env.CONTEMBER_SHUTDOWN_DELAY_MS = '5000'
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.shutdownDelayMs).toBe(5000)
	} finally {
		delete process.env.CONTEMBER_SHUTDOWN_DELAY_MS
	}
})

test('shutdownDelayMs: undefined when the variable is unset', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.shutdownDelayMs).toBeUndefined()
})

test('schemaCacheMaxEntries: read from CONTEMBER_CONTENT_API_SCHEMA_CACHE_MAX_ENTRIES', async () => {
	process.env.CONTEMBER_CONTENT_API_SCHEMA_CACHE_MAX_ENTRIES = '100'
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.contentApi?.schemaCacheMaxEntries).toBe(100)
	} finally {
		delete process.env.CONTEMBER_CONTENT_API_SCHEMA_CACHE_MAX_ENTRIES
	}
})

test('schemaCacheMaxEntries: undefined when the variable is unset', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.contentApi?.schemaCacheMaxEntries).toBeUndefined()
})

test('schemaCacheMaxEntries: zero is refused', () => {
	expect(() => serverConfigSchema({ contentApi: { schemaCacheMaxEntries: 0 } })).toThrow()
})

test('graphql engine: unset when no variable is set', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.contentApi?.graphqlEngine).toBeUndefined()
	expect(serverConfig.contentApi?.graphqlJsonProjects).toBeUndefined()
})

test('graphql engine: read from CONTEMBER_CONTENT_API_GRAPHQL_ENGINE and _GRAPHQL_JSON_PROJECTS', async () => {
	process.env.CONTEMBER_CONTENT_API_GRAPHQL_ENGINE = 'graphql-json'
	process.env.CONTEMBER_CONTENT_API_GRAPHQL_JSON_PROJECTS = 'blog, shop,'
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.contentApi?.graphqlEngine).toBe('graphql-json')
		expect(serverConfig.contentApi?.graphqlJsonProjects).toEqual(['blog', 'shop'])
	} finally {
		delete process.env.CONTEMBER_CONTENT_API_GRAPHQL_ENGINE
		delete process.env.CONTEMBER_CONTENT_API_GRAPHQL_JSON_PROJECTS
	}
})

test('graphql engine: an unknown engine is refused', () => {
	expect(() => serverConfigSchema({ contentApi: { graphqlEngine: 'graphql-other' } })).toThrow()
})

test('graphql engine: an empty value means unset', () => {
	expect(serverConfigSchema({ contentApi: { graphqlEngine: '', graphqlJsonProjects: '' } }).contentApi).toEqual({})
})

test('graphql engine: the project list accepts a list of slugs', () => {
	expect(serverConfigSchema({ contentApi: { graphqlJsonProjects: ['blog', ' shop '] } }).contentApi?.graphqlJsonProjects).toEqual(['blog', 'shop'])
})

test('graphql engine: a project list that is not a list of slugs is refused', () => {
	expect(() => serverConfigSchema({ contentApi: { graphqlJsonProjects: { blog: true } } })).toThrow()
	expect(() => serverConfigSchema({ contentApi: { graphqlJsonProjects: [1] } })).toThrow()
	expect(() => serverConfigSchema({ contentApi: { graphqlJsonProjects: true } })).toThrow()
})

test('migration lock options: read from CONTEMBER_SYSTEM_API_MIGRATION_* with defaults for the retry', async () => {
	process.env.CONTEMBER_SYSTEM_API_MIGRATION_LOCK_TIMEOUT_MS = '2000'
	try {
		const { serverConfig } = await readConfig()
		expect(createMigrationLockOptions(serverConfig.systemApi)).toStrictEqual({ lockTimeoutMs: 2000, maxAttempts: 5, retryDelayMs: 1000 })
	} finally {
		delete process.env.CONTEMBER_SYSTEM_API_MIGRATION_LOCK_TIMEOUT_MS
	}
})

test('migration lock options: unset when no variable is set', async () => {
	const { serverConfig } = await readConfig()
	expect(createMigrationLockOptions(serverConfig.systemApi)).toBeUndefined()
})

test('migration lock options: retry settings without a lock timeout are refused', async () => {
	process.env.CONTEMBER_SYSTEM_API_MIGRATION_MAX_ATTEMPTS = '3'
	try {
		await expect(readConfig()).rejects.toThrow('require migrationLockTimeoutMs')
	} finally {
		delete process.env.CONTEMBER_SYSTEM_API_MIGRATION_MAX_ATTEMPTS
	}
	expect(() => serverConfigSchema({ systemApi: { migrationRetryDelayMs: 0 } })).toThrow('require migrationLockTimeoutMs')
})

test('migration lock options: retry settings with a lock timeout are accepted', () => {
	const config = serverConfigSchema({ systemApi: { migrationLockTimeoutMs: 500, migrationMaxAttempts: 3, migrationRetryDelayMs: 0 } })
	expect(createMigrationLockOptions(config.systemApi)).toStrictEqual({ lockTimeoutMs: 500, maxAttempts: 3, retryDelayMs: 0 })
})

test('migration lock options: zero and negative values are rejected', () => {
	expect(() => serverConfigSchema({ systemApi: { migrationLockTimeoutMs: 0 } })).toThrow('must be a positive integer')
	expect(() => serverConfigSchema({ systemApi: { migrationLockTimeoutMs: 500, migrationMaxAttempts: -1 } })).toThrow('must be a positive integer')
	expect(() => serverConfigSchema({ systemApi: { migrationLockTimeoutMs: 500, migrationRetryDelayMs: -1 } })).toThrow('must be a non-negative integer')
})

test('egress: the guard is off when nothing is configured', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.egress?.guard).toBeUndefined()
})

test('egress: read from CONTEMBER_EGRESS_GUARD, _ALLOW_HTTP and _ALLOWLIST', async () => {
	process.env.CONTEMBER_EGRESS_GUARD = 'true'
	process.env.CONTEMBER_EGRESS_ALLOW_HTTP = 'true'
	process.env.CONTEMBER_EGRESS_ALLOWLIST = 'hooks.internal, 10.0.0.0/8'
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.egress).toStrictEqual({ guard: true, allowHttp: true, allowlist: ['hooks.internal', '10.0.0.0/8'] })
	} finally {
		delete process.env.CONTEMBER_EGRESS_GUARD
		delete process.env.CONTEMBER_EGRESS_ALLOW_HTTP
		delete process.env.CONTEMBER_EGRESS_ALLOWLIST
	}
})

test('egress: an invalid allowlist entry is refused at startup', () => {
	expect(() => serverConfigSchema({ egress: { guard: true, allowlist: '10.0.0.0/40' } })).toThrow('Invalid egress allowlist entry')
})

const requestBodySize = (val: unknown): unknown => serverConfigSchema({ http: { requestBodySize: val } }).http?.requestBodySize

test('requestBodySize: parsed into bytes with binary units', () => {
	expect(requestBodySize('1048576')).toBe(1048576)
	expect(requestBodySize('512kb')).toBe(512 * 1024)
	expect(requestBodySize('10MB')).toBe(10 * 1024 * 1024)
	expect(requestBodySize('1.5 mb')).toBe(1572864)
})

test('requestBodySize: empty means the default', () => {
	expect(requestBodySize('')).toBeUndefined()
})

test('requestBodySize: a malformed size fails instead of disabling the limit', () => {
	for (const value of ['abc', '10 megabytes', '-1mb', '1e6', 'mb']) {
		expect(() => requestBodySize(value)).toThrow()
	}
})

const requestLog = (val: unknown): unknown => serverConfigSchema({ contentApi: { requestLog: val } }).contentApi?.requestLog

const inOneDay = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString()

test('content request log: off when nothing is configured', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.contentApi?.requestLog).toBeUndefined()
})

test('content request log: off without listed projects, even with a destination', () => {
	expect(requestLog({ file: '/var/log/requests.jsonl', maxRequests: 100, until: inOneDay() })).toBeUndefined()
	expect(requestLog({ projects: '', file: '/var/log/requests.jsonl', maxRequests: 100, until: inOneDay() })).toBeUndefined()
})

test('content request log: empty variables of an unused log do not stop startup', async () => {
	const keys = ['PROJECTS', 'FILE', 'MAX_REQUESTS', 'UNTIL'].map(it => `CONTEMBER_CONTENT_API_REQUEST_LOG_${it}`)
	for (const key of keys) {
		process.env[key] = ''
	}
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.contentApi?.requestLog).toBeUndefined()
	} finally {
		for (const key of keys) {
			delete process.env[key]
		}
	}
})

test('content request log: read from CONTEMBER_CONTENT_API_REQUEST_LOG_*', async () => {
	const until = inOneDay()
	process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_PROJECTS = 'blog, shop'
	process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_FILE = '/var/log/requests.jsonl'
	process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_MAX_REQUESTS = '500'
	process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_UNTIL = until
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.contentApi?.requestLog).toEqual({
			projects: ['blog', 'shop'],
			file: '/var/log/requests.jsonl',
			maxRequests: 500,
			until,
		})
	} finally {
		delete process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_PROJECTS
		delete process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_FILE
		delete process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_MAX_REQUESTS
		delete process.env.CONTEMBER_CONTENT_API_REQUEST_LOG_UNTIL
	}
})

test('content request log: listed projects require a destination, a cap and an end', () => {
	const complete = { projects: ['blog'], file: '/var/log/requests.jsonl', maxRequests: 100, until: inOneDay() }
	expect(() => requestLog({ ...complete, file: undefined })).toThrow(/file/)
	expect(() => requestLog({ ...complete, file: '' })).toThrow(/file/)
	expect(() => requestLog({ ...complete, maxRequests: undefined })).toThrow(/maxRequests/)
	expect(() => requestLog({ ...complete, until: undefined })).toThrow(/until/)
})

test('content request log: the cap is positive and bounded', () => {
	const complete = { projects: ['blog'], file: '/var/log/requests.jsonl', until: inOneDay() }
	expect(() => requestLog({ ...complete, maxRequests: 0 })).toThrow()
	expect(() => requestLog({ ...complete, maxRequests: 100_001 })).toThrow(/at most 100000/)
})

test('content request log: `until` is an ISO timestamp with a time zone, at most 7 days ahead', () => {
	const complete = { projects: ['blog'], file: '/var/log/requests.jsonl', maxRequests: 100 }
	expect(() => requestLog({ ...complete, until: 'tomorrow' })).toThrow(/ISO timestamp/)
	expect(() => requestLog({ ...complete, until: '2026-01-02T18:00:00' })).toThrow(/time zone/)
	expect(() => requestLog({ ...complete, until: 'Nov 19 2026 Z' })).toThrow(/ISO timestamp/)
	expect(() => requestLog({ ...complete, until: '2026-11-19 10:00:00Z' })).toThrow(/ISO timestamp/)
	expect(() => requestLog({ ...complete, until: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString() })).toThrow(/7 days/)
	// a past end is accepted: the forgotten configuration just records nothing
	expect(requestLog({ ...complete, until: '2020-01-01T00:00:00+02:00' })).toEqual({
		...complete,
		projects: ['blog'],
		until: '2019-12-31T22:00:00.000Z',
	})
})

test('content request log: `until` from a YAML config must be quoted', async () => {
	const yaml = (until: string) =>
		`server:
  contentApi:
    requestLog:
      projects: [blog]
      file: /var/log/requests.jsonl
      maxRequests: 100
      until: ${until}
`
	const until = inOneDay()
	const { serverConfig } = await readConfig([{ type: 'yaml', data: yaml(`'${until}'`) }])
	expect(serverConfig.contentApi?.requestLog?.until).toBe(until)
	await expect(readConfig([{ type: 'yaml', data: yaml(until) }])).rejects.toThrow(/quote it in YAML/)
})
