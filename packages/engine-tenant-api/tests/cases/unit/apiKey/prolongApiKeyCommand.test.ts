import { expect, test } from 'bun:test'
import { ApiKey, ApiKeyRequestInfo, ApiKeyTrackingState, DatabaseContext, ProlongApiKeyCommand, Providers } from '../../../../src/index.js'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'

const baseProviders: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => new Date('2026-05-12T12:00:00Z'),
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

const exec = async (args: {
	now: Date
	currentExpiration: Date | null
	requestInfo?: ApiKeyRequestInfo
	tracking?: ApiKeyTrackingState
	maxExpiresAt?: Date | null
	expectedQueries: ExpectedQuery[]
}) => {
	const cmd = new ProlongApiKeyCommand(
		'api-key-id',
		ApiKey.Type.SESSION,
		30,
		args.currentExpiration,
		args.requestInfo,
		args.tracking,
		args.maxExpiresAt,
	)
	const connection = createConnectionMock(args.expectedQueries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const providers: Providers = { ...baseProviders, now: () => args.now }
	const db = new DatabaseContext(client, providers)
	await db.commandBus.execute(cmd)
	expect(args.expectedQueries).toHaveLength(0)
}

test('no-op when no requestInfo and prolongation is throttled', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:29:30Z')
	await exec({ now, currentExpiration, expectedQueries: [] })
})

test('updates expires_at when prolongation is significant', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:25:00Z')
	await exec({
		now,
		currentExpiration,
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "expires_at" = LEAST(now() + make_interval(secs => ?), "max_expires_at") where "id" = ?`,
				parameters: [1800, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})

test('updates last_* on first usage', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:29:30Z')
	await exec({
		now,
		currentExpiration,
		requestInfo: { ip: '203.0.113.5', userAgent: 'curl' },
		tracking: { lastIp: null, lastUserAgent: null, lastUsedAt: null },
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "last_ip" = ?, "last_user_agent" = ?, "last_used_at" = ? where "id" = ?`,
				parameters: ['203.0.113.5', 'curl', now, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})

test('throttles last_* within window for same IP+UA', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:29:30Z')
	await exec({
		now,
		currentExpiration,
		requestInfo: { ip: '203.0.113.5', userAgent: 'curl' },
		tracking: {
			lastIp: '203.0.113.5',
			lastUserAgent: 'curl',
			lastUsedAt: new Date('2026-05-12T11:59:50Z'),
		},
		expectedQueries: [],
	})
})

test('bypasses throttle when IP changes', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:29:30Z')
	await exec({
		now,
		currentExpiration,
		requestInfo: { ip: '198.51.100.7', userAgent: 'curl' },
		tracking: {
			lastIp: '203.0.113.5',
			lastUserAgent: 'curl',
			lastUsedAt: new Date('2026-05-12T11:59:50Z'),
		},
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "last_ip" = ?, "last_user_agent" = ?, "last_used_at" = ? where "id" = ?`,
				parameters: ['198.51.100.7', 'curl', now, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})

test('A19: clamps expires_at at max_expires_at when the sliding window would exceed it', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	// 30-minute window would push expires_at to 12:30, but the absolute cap is 12:10.
	const currentExpiration = new Date('2026-05-12T12:05:00Z')
	const maxExpiresAt = new Date('2026-05-12T12:10:00Z')
	await exec({
		now,
		currentExpiration,
		maxExpiresAt,
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "expires_at" = LEAST(now() + make_interval(secs => ?), "max_expires_at") where "id" = ?`,
				parameters: [1800, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})

test('A19: unaffected when max_expires_at is null (today behavior)', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:25:00Z')
	await exec({
		now,
		currentExpiration,
		maxExpiresAt: null,
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "expires_at" = LEAST(now() + make_interval(secs => ?), "max_expires_at") where "id" = ?`,
				parameters: [1800, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})

test('bypasses throttle when User-Agent changes', async () => {
	const now = new Date('2026-05-12T12:00:00Z')
	const currentExpiration = new Date('2026-05-12T12:29:30Z')
	await exec({
		now,
		currentExpiration,
		requestInfo: { ip: '203.0.113.5', userAgent: 'browser/2' },
		tracking: {
			lastIp: '203.0.113.5',
			lastUserAgent: 'curl',
			lastUsedAt: new Date('2026-05-12T11:59:50Z'),
		},
		expectedQueries: [
			{
				sql: `update "tenant"."api_key" set "last_ip" = ?, "last_user_agent" = ?, "last_used_at" = ? where "id" = ?`,
				parameters: ['203.0.113.5', 'browser/2', now, 'api-key-id'],
				response: { rowCount: 1 },
			},
		],
	})
})
