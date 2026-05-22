import { expect, test } from 'bun:test'
import {
	ApiKey,
	ApiKeyManager,
	ApiKeyService,
	AuthLogService,
	AuthPolicyResolver,
	computeTokenHash,
	DatabaseContext,
	Providers,
} from '../../../../src'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import PostgresInterval from 'postgres-interval'

const TOKEN = '0000000000000000000000000000000000000000'
const TOKEN_HASH = computeTokenHash(TOKEN)
// verifyAndProlong now reads providers.now() (single injectable clock), so fixtures
// are anchored relative to that fixed clock rather than the real wall clock.
const NOW = new Date('2026-05-21T12:00:00Z')
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000)
const minutesAhead = (m: number) => new Date(NOW.getTime() + m * 60_000)

const baseProviders: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => '00000000-0000-0000-0000-000000000000',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: () => Buffer.alloc(0),
}

type Row = {
	id: string
	type: string
	identity_id: string
	disabled_at: Date | null
	expires_at: Date | null
	roles: string[]
	expiration: number | null
	person_id: string | null
	last_ip: string | null
	last_user_agent: string | null
	last_used_at: Date | null
	trust_forwarded_info: boolean
	issued_at: Date | null
	idle_timeout: ReturnType<typeof PostgresInterval> | null
	max_expires_at: Date | null
}

const defaultRow = (overrides: Partial<Row>): Row => ({
	id: 'api-key-id',
	type: ApiKey.Type.SESSION,
	identity_id: 'identity-id',
	disabled_at: null,
	expires_at: minutesAhead(30),
	roles: ['editor'],
	expiration: 30,
	person_id: 'person-id',
	last_ip: null,
	last_user_agent: null,
	last_used_at: null,
	trust_forwarded_info: false,
	issued_at: null,
	idle_timeout: null,
	max_expires_at: null,
	...overrides,
})

const selectByToken = (row: Row | null): ExpectedQuery => ({
	sql:
		`select "api_key"."id", "api_key"."type", "api_key"."identity_id", "api_key"."disabled_at", "api_key"."expires_at", "identity"."roles", "api_key"."expiration", "person"."id" as "person_id", "api_key"."last_ip", "api_key"."last_user_agent", "api_key"."last_used_at", "api_key"."trust_forwarded_info", "api_key"."issued_at", "api_key"."idle_timeout", "api_key"."max_expires_at" from "tenant"."api_key" inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id" left join "tenant"."person" as "person" on "person"."identity_id" = "identity"."id" where "token_hash" = ?`,
	parameters: [TOKEN_HASH],
	response: { rows: row ? [row] : [] },
})

const disableUpdate: ExpectedQuery = {
	sql: `update "tenant"."api_key" set "disabled_at" = ? where "id" = ?`,
	parameters: [(val: unknown) => val instanceof Date, 'api-key-id'],
	response: { rowCount: 1 },
}

// The background prolong UPDATE fires in setImmediate on the allowed path
// (no requestInfo → only expires_at is touched). We allow but don't assert it.
const prolongUpdate: ExpectedQuery = {
	sql: `update "tenant"."api_key" set "expires_at" = ? where "id" = ?`,
	parameters: [(val: unknown) => val instanceof Date, 'api-key-id'],
	response: { rowCount: 1 },
}

// Captures the `type` of the session_expired_idle person_auth_log insert.
// The idle key carries a person_id, so the InsertBuilder emits it → columns are
// id, invoked_by_id, person_id, type, success, metadata, event_data.
const authLogInsert = (capture: { type?: string }): ExpectedQuery => ({
	sql:
		`insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "person_id", "type", "success", "metadata", "event_data") values  (?, ?, ?, ?, ?, ?, ?)`,
	parameters: [
		() => true,
		() => true,
		() => true,
		(value: any) => {
			capture.type = value
			return true
		},
		() => true,
		() => true,
		() => true,
	],
	response: { rowCount: 1 },
})

const run = async (row: Row | null, expectedQueries: ExpectedQuery[], allowProlong = false) => {
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService())
	const queries = [selectByToken(row), ...expectedQueries, ...(allowProlong ? [prolongUpdate] : [])]
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, baseProviders)
	const response = await manager.verifyAndProlong(db, db, TOKEN)
	// Let the setImmediate-scheduled prolong run before the connection mock is torn down.
	await new Promise(resolve => setImmediate(resolve))
	return response
}

test('A19: idle-expired key (last_used_at older than idle_timeout) is rejected and disabled', async () => {
	const row = defaultRow({
		idle_timeout: PostgresInterval('00:15:00'),
		last_used_at: minutesAgo(20), // 20 min ago > 15 min idle timeout
	})
	const authLog: { type?: string } = {}
	const response = await run(row, [disableUpdate, authLogInsert(authLog)])
	expect(response.ok).toBe(false)
	// A19: idle rejection emits a session_expired_idle audit entry.
	expect(authLog.type).toBe('session_expired_idle')
})

test('A19: idle within the prolong-throttle slack is NOT expired (small idle_timeout)', async () => {
	// last_used_at is written at most once per 60s, so a continuously-active session
	// can legitimately lag by up to that window. With idle_timeout=1min, a key last
	// seen 90s ago (< 1min + 60s slack) must stay alive rather than be disabled.
	const row = defaultRow({
		idle_timeout: PostgresInterval('00:01:00'),
		last_used_at: new Date(NOW.getTime() - 90_000),
	})
	const response = await run(row, [], true)
	expect(response.ok).toBe(true)
})

test('A19: idle beyond idle_timeout + slack is still expired (small idle_timeout)', async () => {
	const row = defaultRow({
		idle_timeout: PostgresInterval('00:01:00'),
		last_used_at: new Date(NOW.getTime() - 150_000), // 150s > 60s + 60s slack
	})
	const response = await run(row, [disableUpdate, authLogInsert({})])
	expect(response.ok).toBe(false)
})

test('A19: fresh key within idle_timeout is allowed', async () => {
	const row = defaultRow({
		idle_timeout: PostgresInterval('00:15:00'),
		last_used_at: minutesAgo(5), // 5 min ago < 15 min
	})
	// Prolong runs in setImmediate (async); only the synchronous verify is asserted.
	const response = await run(row, [], true)
	expect(response.ok).toBe(true)
})

test('A19: key with idle_timeout but never used (last_used_at null) is allowed', async () => {
	const row = defaultRow({
		idle_timeout: PostgresInterval('00:15:00'),
		last_used_at: null,
	})
	const response = await run(row, [], true)
	expect(response.ok).toBe(true)
})

test('A19: no idle_timeout behaves as today (allowed regardless of last_used_at)', async () => {
	const row = defaultRow({
		idle_timeout: null,
		last_used_at: minutesAgo(60 * 24 * 365), // ancient, but no idle policy
	})
	const response = await run(row, [], true)
	expect(response.ok).toBe(true)
})

test('A19: absolute cap (now >= max_expires_at) rejects and disables', async () => {
	const row = defaultRow({
		max_expires_at: minutesAgo(60), // already past
	})
	const response = await run(row, [disableUpdate])
	expect(response.ok).toBe(false)
})
