import { describe, expect, test } from 'bun:test'
import PostgresInterval from 'postgres-interval'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { Config, DatabaseContext, Providers, RateLimiter } from '../../../src'

const NOW = new Date('2026-05-20T12:00:00.000Z')

const baseProviders: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => 'rate-limit-event-id',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	// Mirrors the real sha256 contract closely enough to assert the key is hashed
	// (and never stored raw) without pulling in node:crypto.
	hash: (value, algo) => Buffer.from(`${String(algo)}:${value.toString()}`),
}

const configWith = (limit: number, window = '01:00:00'): Config =>
	({
		rateLimits: {
			signUpPerIp: { limit, window: PostgresInterval(window) },
			loginPerIp: { limit, window: PostgresInterval(window) },
			passwordResetPerIp: { limit, window: PostgresInterval(window) },
			passwordlessInitPerIp: { limit, window: PostgresInterval(window) },
		},
	}) as unknown as Config

const COUNT_SQL = `select count(*)::text as count from "tenant"."rate_limit_event"
	where "scope" = ? and "key_hash" = ? and "occurred_at" >= ?`
const INSERT_SQL = `insert into "tenant"."rate_limit_event" ("id", "scope", "key_hash", "occurred_at") values (?, ?, ?, ?)`

const expectedHash = Buffer.from('sha256:1.2.3.4')

const run = async (args: {
	limit: number
	queries: ExpectedQuery[]
	key?: string | null
	scope?: 'sign_up_per_ip' | 'login_per_ip'
}) => {
	const connection = createConnectionMock(args.queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, baseProviders)
	const limiter = new RateLimiter(baseProviders)
	const decision = await limiter.consume(
		db,
		args.scope ?? 'sign_up_per_ip',
		args.key === undefined ? '1.2.3.4' : args.key,
		configWith(args.limit),
	)
	expect(args.queries).toHaveLength(0)
	return decision
}

describe('RateLimiter', () => {
	test('passes through without touching the DB when the key is missing', async () => {
		expect(await run({ limit: 5, key: null, queries: [] })).toEqual({ ok: true })
		expect(await run({ limit: 5, key: '', queries: [] })).toEqual({ ok: true })
	})

	test('disabled limit (0) skips the COUNT query but still records the event', async () => {
		// NOTE: `check` short-circuits on limit <= 0 (no COUNT), yet `consume`
		// records because the decision is ok. So a "disabled" limit still writes
		// one rate_limit_event row per call (with a real key). Pinning current
		// behaviour — see review note about the unnecessary write.
		const decision = await run({
			limit: 0,
			queries: [
				{
					sql: INSERT_SQL,
					parameters: ['rate-limit-event-id', 'sign_up_per_ip', expectedHash, NOW],
					response: { rowCount: 1 },
				},
			],
		})
		expect(decision).toEqual({ ok: true })
	})

	test('records the event (hashed key, current timestamp) when under the limit', async () => {
		const decision = await run({
			limit: 3,
			queries: [
				{
					sql: COUNT_SQL,
					// window of 1h → occurred_at >= NOW - 3600s
					parameters: ['sign_up_per_ip', expectedHash, new Date('2026-05-20T11:00:00.000Z')],
					response: { rows: [{ count: '2' }] },
				},
				{
					sql: INSERT_SQL,
					parameters: ['rate-limit-event-id', 'sign_up_per_ip', expectedHash, NOW],
					response: { rowCount: 1 },
				},
			],
		})
		expect(decision).toEqual({ ok: true })
	})

	test('denies and does NOT record when the count has reached the limit', async () => {
		const decision = await run({
			limit: 3,
			queries: [
				{
					sql: COUNT_SQL,
					parameters: ['sign_up_per_ip', expectedHash, new Date('2026-05-20T11:00:00.000Z')],
					response: { rows: [{ count: '3' }] },
				},
				// no INSERT — a denied attempt must not extend the window
			],
		})
		expect(decision).toEqual({ ok: false, retryAfterSeconds: 3600 })
	})

	test('denies once the count exceeds the limit', async () => {
		const decision = await run({
			limit: 3,
			queries: [
				{
					sql: COUNT_SQL,
					parameters: ['sign_up_per_ip', expectedHash, new Date('2026-05-20T11:00:00.000Z')],
					response: { rows: [{ count: '9' }] },
				},
			],
		})
		expect(decision).toEqual({ ok: false, retryAfterSeconds: 3600 })
	})
})
