import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import {
	ApiKey,
	computeTokenHash,
	CreateApiKeyCommand,
	DatabaseContext,
	RateLimitCountQuery,
	RecordRateLimitEventCommand,
	SavePersonTokenCommand,
} from '../../../../src/index.js'
import type { Providers } from '../../../../src/index.js'
import { ApiKeyByTokenQuery } from '../../../../src/model/queries/apiKey/ApiKeyQuery.js'
import { PersonTokenQuery } from '../../../../src/model/queries/personToken/PersonTokenQuery.js'
import { createConnection } from '../../../src/dbUtils.js'

const APP_NOW = new Date('2000-01-01T00:00:00.000Z')
const TOKEN_EXPIRATION_MINUTES = 15
const databaseName = process.env.TEST_DB_NAME ?? ''

const databaseConfigured = Boolean(
	process.env.TEST_DB_HOST
		&& process.env.TEST_DB_PORT
		&& process.env.TEST_DB_USER
		&& process.env.TEST_DB_PASSWORD
		&& databaseName,
)

const createSkewedProviders = (uuid: string): Providers => ({
	uuid: () => uuid,
	now: () => APP_NOW,
	randomBytes: async bytes => Buffer.alloc(bytes),
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: true,
})

const getDatabaseNow = async (db: DatabaseContext): Promise<Date> => {
	const result = await db.client.query<{ now: Date }>('SELECT now() AS "now"')
	return result.rows[0].now
}

test.skipIf(!databaseConfigured)('person token lifetime and expiry gate use the database clock', async () => {
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const tokenId = crypto.randomUUID()
	const token = crypto.randomUUID()
	const tokenHash = computeTokenHash(token)
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-db-clock-test' }), createSkewedProviders(tokenId))

	try {
		await db.client.query(
			'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, ?)',
			[identityId, null, JSON.stringify(['person']), 'DB clock integration test', APP_NOW],
		)
		await db.client.query(
			'INSERT INTO "tenant"."person" ("id", "identity_id") VALUES (?, ?)',
			[personId, identityId],
		)

		const databaseBeforeInsert = await getDatabaseNow(db)
		const created = await db.commandBus.execute(
			new SavePersonTokenCommand(personId, tokenHash, 'passwordless', TOKEN_EXPIRATION_MINUTES),
		)
		const databaseAfterInsert = await getDatabaseNow(db)
		const lifetimeMs = TOKEN_EXPIRATION_MINUTES * 60 * 1000

		expect(created).toEqual({ id: tokenId, expiresAt: expect.any(Date) })
		expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(databaseBeforeInsert.getTime() + lifetimeMs)
		expect(created.expiresAt.getTime()).toBeLessThanOrEqual(databaseAfterInsert.getTime() + lifetimeMs)
		expect(created.expiresAt.getUTCFullYear()).not.toBe(APP_NOW.getUTCFullYear())

		const active = await db.queryHandler.fetch(PersonTokenQuery.byToken(token, 'passwordless'))
		expect(active?.is_expired).toBe(false)

		await db.client.query(
			'UPDATE "tenant"."person_token" SET "expires_at" = now() - interval \'1 second\' WHERE "id" = ?',
			[tokenId],
		)
		const expired = await db.queryHandler.fetch(PersonTokenQuery.byToken(token, 'passwordless'))
		expect(expired?.is_expired).toBe(true)
	} finally {
		await db.client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await db.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
		await connection.end()
	}
})

test.skipIf(!databaseConfigured)('rate-limit events and windows use the database clock', async () => {
	const eventId = crypto.randomUUID()
	const keyHash = crypto.randomBytes(32)
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-db-clock-test' }), createSkewedProviders(eventId))

	try {
		const databaseBeforeInsert = await getDatabaseNow(db)
		await db.commandBus.execute(new RecordRateLimitEventCommand('sign_up_per_ip', keyHash))
		const databaseAfterInsert = await getDatabaseNow(db)
		const inserted = await db.client.query<{ occurred_at: Date }>(
			'SELECT "occurred_at" FROM "tenant"."rate_limit_event" WHERE "id" = ?',
			[eventId],
		)
		const occurredAt = inserted.rows[0].occurred_at

		expect(occurredAt.getTime()).toBeGreaterThanOrEqual(databaseBeforeInsert.getTime())
		expect(occurredAt.getTime()).toBeLessThanOrEqual(databaseAfterInsert.getTime())
		expect(occurredAt.getUTCFullYear()).not.toBe(APP_NOW.getUTCFullYear())
		expect(await db.queryHandler.fetch(new RateLimitCountQuery('sign_up_per_ip', keyHash, 60))).toBe(1)
	} finally {
		await db.client.query('DELETE FROM "tenant"."rate_limit_event" WHERE "id" = ?', [eventId])
		await connection.end()
	}
})

test.skipIf(!databaseConfigured)('API key expiry and idle gates use the database clock', async () => {
	const identityId = crypto.randomUUID()
	const apiKeyId = crypto.randomUUID()
	const token = crypto.randomUUID()
	const tokenHash = computeTokenHash(token)
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-db-clock-test' }), createSkewedProviders(apiKeyId))

	try {
		await db.client.query(
			'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, ?)',
			[identityId, null, JSON.stringify([]), 'DB clock integration test', APP_NOW],
		)
		await db.commandBus.execute(
			new CreateApiKeyCommand({
				type: ApiKey.Type.SESSION,
				identityId,
				tokenHash,
				expiration: TOKEN_EXPIRATION_MINUTES,
				idleTimeout: '1 minute',
				maxExpirationSeconds: 60 * 60,
			}),
		)

		const active = await db.queryHandler.fetch(new ApiKeyByTokenQuery(token))
		expect(active).toMatchObject({
			id: apiKeyId,
			is_expired: false,
			is_max_expired: false,
			is_idle_expired: false,
		})
		expect(active?.expires_at?.getUTCFullYear()).not.toBe(APP_NOW.getUTCFullYear())

		await db.client.query(
			`UPDATE "tenant"."api_key"
			 SET "expires_at" = now() - interval '1 second',
			     "max_expires_at" = now() - interval '1 second',
			     "last_used_at" = now() - interval '3 minutes'
			 WHERE "id" = ?`,
			[apiKeyId],
		)
		const expired = await db.queryHandler.fetch(new ApiKeyByTokenQuery(token))
		expect(expired).toMatchObject({
			is_expired: true,
			is_max_expired: true,
			is_idle_expired: true,
		})
	} finally {
		await db.client.query('DELETE FROM "tenant"."api_key" WHERE "id" = ?', [apiKeyId])
		await db.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
		await connection.end()
	}
})
