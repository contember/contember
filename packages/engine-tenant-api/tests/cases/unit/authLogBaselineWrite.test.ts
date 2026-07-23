import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { AuthLogService, DatabaseContext, LoginRiskAnalyzer, TenantResolverContextFactory } from '../../../src/index.js'
import { ResponseOk } from '../../../src/model/utils/Response.js'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'

// A03: the whole feature is self-sustaining only because every successful sign-in
// stamps `geo_country` + `device_fingerprint` onto its person_auth_log row, which
// becomes the next sign-in's baseline (LoginRiskAnalyzer.analyze reads exactly
// those columns + ip_address). The integration suite mocks `logAuthAction`, so it
// never exercises this INSERT — these tests cover the real write end-to-end. A
// regression dropping the columns, or stamping the raw UA instead of its hash,
// would otherwise score every later login as "new device"/"new country" forever
// with no failing test.

const hash = (value: crypto.BinaryLike, algo: string) => crypto.createHash(algo).update(value).digest()
const UA = 'Mozilla/5.0 (Macintosh)'
const FINGERPRINT = crypto.createHash('sha256').update(UA).digest('hex')

const providers = {
	uuid: () => '11111111-1111-1111-1111-111111111111',
	hash,
} as any

const logger = createLogger(new JsonStreamLoggerHandler(process.stderr))

const runWithQuery = async (query: ExpectedQuery, run: (db: DatabaseContext) => Promise<void>) => {
	const queries = [query]
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, providers)
	await run(db)
	// The connection mock consumes a query per executed statement; an unconsumed
	// query means the INSERT never ran.
	expect(queries).toHaveLength(0)
}

// Captures the geo_country / device_fingerprint bound to the INSERT.
const insertCapturing = (captured: { geo?: unknown; fp?: unknown }): ExpectedQuery => ({
	sql:
		`insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "error_code", "ip_address", "user_agent", "metadata", "geo_country", "device_fingerprint") values  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	parameters: [
		() => true, // id (uuid)
		'identity-1', // invoked_by_id
		'login',
		true,
		null, // error_code (ok response → null, not omitted)
		'203.0.113.5', // ip_address
		UA, // user_agent
		() => true, // metadata {}
		(value: unknown) => {
			captured.geo = value
			return true
		},
		(value: unknown) => {
			captured.fp = value
			return true
		},
	],
	response: { rowCount: 1 },
})

test('AuthLogService.logAuthAction persists geo_country and device_fingerprint on the row', async () => {
	const captured: { geo?: unknown; fp?: unknown } = {}
	await runWithQuery(insertCapturing(captured), async db => {
		await new AuthLogService().logAuthAction(db, {
			identityId: 'identity-1',
			clientIp: '203.0.113.5',
			userAgent: UA,
			geoCountry: 'US',
			deviceFingerprint: FINGERPRINT,
		}, { type: 'login', response: new ResponseOk({}) })
	})
	expect(captured.geo).toBe('US')
	expect(captured.fp).toBe(FINGERPRINT)
})

test('an absent country / user-agent stamps NULL (column omitted), never an empty string', async () => {
	// No geoCountry, no deviceFingerprint, no ip/UA → those columns are omitted from
	// the INSERT entirely, so the DB stores NULL. Empty strings would corrupt the
	// next sign-in's history comparison (an empty fingerprint would match nothing).
	await runWithQuery({
		sql: `insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "error_code", "metadata") values  (?, ?, ?, ?, ?, ?)`,
		parameters: [() => true, 'identity-1', 'login', true, null, () => true],
		response: { rowCount: 1 },
	}, async db => {
		await new AuthLogService().logAuthAction(db, { identityId: 'identity-1' }, { type: 'login', response: new ResponseOk({}) })
	})
})

test('an unpersisted root actor is audited without a dangling identity foreign key', async () => {
	await runWithQuery({
		sql: `insert into  "tenant"."person_auth_log" ("id", "type", "success", "error_code", "metadata") values  (?, ?, ?, ?, ?)`,
		parameters: [
			() => true,
			'custom_role_change',
			true,
			null,
			(value: unknown) => {
				expect(value).toEqual({ actor: 'unpersisted_root' })
				return true
			},
		],
		response: { rowCount: 1 },
	}, async db => {
		await new AuthLogService().logAuthAction(
			db,
			{ unpersistedRoot: true },
			{ type: 'custom_role_change', response: new ResponseOk({}) },
		)
	})
})

test('TenantResolverContextFactory stamps device_fingerprint = analyzer.fingerprint(UA) and the geo country', async () => {
	// The end-to-end stamping: the factory computes the fingerprint via the SAME
	// LoginRiskAnalyzer.fingerprint that score() later compares history against, so a
	// "same browser" sign-in is recognised. This is the link a regression would break.
	const analyzer = new LoginRiskAnalyzer(hash)
	const permissionContextFactory = {
		create: () => ({
			identity: { id: 'identity-1', roles: [] },
			isAllowed: () => Promise.resolve(true),
			requireAccess: () => Promise.resolve(),
		}),
	} as any
	const factory = new TenantResolverContextFactory(permissionContextFactory, new AuthLogService(), analyzer)

	const captured: { geo?: unknown; fp?: unknown } = {}
	await runWithQuery(insertCapturing(captured), async db => {
		const context = factory.create(
			{ apiKeyId: 'api-key-1', identityId: 'identity-1', roles: [] },
			{ ip: '203.0.113.5', userAgent: UA, geoCountry: 'US' },
			db,
			logger,
		)
		await context.logAuthAction({ type: 'login', response: new ResponseOk({}) })
	})
	expect(captured.fp).toBe(analyzer.fingerprint(UA))
	expect(captured.fp).toBe(FINGERPRINT)
	expect(captured.geo).toBe('US')
})
