import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import {
	ApiKey,
	computeTokenHash,
	CreateApiKeyCommand,
	DatabaseContext,
	ResetPasswordCommand,
	RevokePersonSessionsCommand,
	SavePersonTokenCommand,
} from '../../../../src/index.js'
import type { Providers } from '../../../../src/index.js'
import { createConnection } from '../../../src/dbUtils.js'

const databaseName = process.env.TEST_DB_NAME ?? ''

const databaseConfigured = Boolean(
	process.env.TEST_DB_HOST
		&& process.env.TEST_DB_PORT
		&& process.env.TEST_DB_USER
		&& process.env.TEST_DB_PASSWORD
		&& databaseName,
)

const createProviders = (): Providers => ({
	uuid: () => crypto.randomUUID(),
	now: () => new Date(),
	randomBytes: async bytes => Buffer.alloc(bytes),
	bcrypt: async value => `bcrypted-${value}`,
	bcryptCompare: async () => true,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: true,
})

type Fixture = {
	db: DatabaseContext
	personId: string
	keys: { current: string; other: string; permanent: string }
	resetToken: string
	end: () => Promise<void>
}

const createFixture = async (): Promise<Fixture> => {
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-revoke-sessions-test' }), createProviders())
	await db.client.query(
		'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
		[identityId, null, JSON.stringify(['person']), 'revoke sessions test'],
	)
	await db.client.query('INSERT INTO "tenant"."person" ("id", "identity_id", "password_hash") VALUES (?, ?, ?)', [personId, identityId, 'old'])
	const createKey = async (args: { type: ApiKey.Type.SESSION; expiration: number } | { type: ApiKey.Type.PERMANENT }) => {
		const tokenHash = computeTokenHash(crypto.randomUUID())
		await db.commandBus.execute(new CreateApiKeyCommand({ ...args, identityId, tokenHash }))
		const rows = await db.client.query<{ id: string }>('SELECT "id" FROM "tenant"."api_key" WHERE "token_hash" = ?', [tokenHash])
		return rows.rows[0].id
	}
	const keys = {
		current: await createKey({ type: ApiKey.Type.SESSION, expiration: 30 }),
		other: await createKey({ type: ApiKey.Type.SESSION, expiration: 30 }),
		permanent: await createKey({ type: ApiKey.Type.PERMANENT }),
	}
	const resetToken = crypto.randomUUID()
	await db.commandBus.execute(new SavePersonTokenCommand(personId, computeTokenHash(resetToken), 'password_reset', 60))
	await db.commandBus.execute(new SavePersonTokenCommand(personId, computeTokenHash(crypto.randomUUID()), 'passwordless', 60))
	return {
		db,
		personId,
		keys,
		resetToken,
		end: async () => {
			await db.client.query('DELETE FROM "tenant"."person_token" WHERE "person_id" = ?', [personId])
			await db.client.query('DELETE FROM "tenant"."api_key" WHERE "identity_id" = ?', [identityId])
			await db.client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
			await db.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
			await connection.end()
		},
	}
}

const disabledKeys = async ({ db, keys }: Fixture): Promise<Record<string, boolean>> => {
	const rows = await db.client.query<{ id: string; disabled: boolean }>(
		'SELECT "id", "disabled_at" IS NOT NULL AS "disabled" FROM "tenant"."api_key" WHERE "id" IN (?, ?, ?)',
		[keys.current, keys.other, keys.permanent],
	)
	const byId = new Map(rows.rows.map(it => [it.id, it.disabled]))
	return { current: byId.get(keys.current) ?? false, other: byId.get(keys.other) ?? false, permanent: byId.get(keys.permanent) ?? false }
}

const unusedTokenCount = async ({ db, personId }: Fixture): Promise<number> => {
	const rows = await db.client.query<{ count: number }>(
		'SELECT count(*)::int AS "count" FROM "tenant"."person_token" WHERE "person_id" = ? AND "used_at" IS NULL',
		[personId],
	)
	return rows.rows[0].count
}

test.skipIf(!databaseConfigured)('revoking keeps the given session and permanent keys, ends other sessions and unused tokens', async () => {
	const fixture = await createFixture()
	try {
		await fixture.db.commandBus.execute(new RevokePersonSessionsCommand(fixture.personId, fixture.keys.current))

		expect(await disabledKeys(fixture)).toEqual({ current: false, other: true, permanent: false })
		expect(await unusedTokenCount(fixture)).toBe(0)
	} finally {
		await fixture.end()
	}
})

test.skipIf(!databaseConfigured)('a password reset revokes every session only when asked to', async () => {
	const keeping = await createFixture()
	try {
		const result = await keeping.db.commandBus.execute(new ResetPasswordCommand(keeping.resetToken, 'new-password', false))
		expect(result.ok).toBe(true)
		expect(await disabledKeys(keeping)).toEqual({ current: false, other: false, permanent: false })
		expect(await unusedTokenCount(keeping)).toBe(1)
	} finally {
		await keeping.end()
	}

	const revoking = await createFixture()
	try {
		const result = await revoking.db.commandBus.execute(new ResetPasswordCommand(revoking.resetToken, 'new-password', true))
		expect(result.ok).toBe(true)
		expect(await disabledKeys(revoking)).toEqual({ current: true, other: true, permanent: false })
		expect(await unusedTokenCount(revoking)).toBe(0)
	} finally {
		await revoking.end()
	}
})
