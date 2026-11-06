import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { ClaimTotpCounterCommand, DatabaseContext, DisableOtpCommand } from '../../../../src/index.js'
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

const providers: Providers = {
	uuid: () => crypto.randomUUID(),
	now: () => new Date(),
	randomBytes: async bytes => Buffer.alloc(bytes),
	bcrypt: async value => `bcrypted-${value}`,
	bcryptCompare: async () => true,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: true,
}

test.skipIf(!databaseConfigured)('a TOTP time step is accepted once and never after a later one', async () => {
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-totp-counter-test' }), providers)
	await db.client.query(
		'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
		[identityId, null, JSON.stringify(['person']), 'totp counter test'],
	)
	await db.client.query('INSERT INTO "tenant"."person" ("id", "identity_id") VALUES (?, ?)', [personId, identityId])
	await db.client.query(
		'INSERT INTO "tenant"."person_mfa" ("person_id", "totp_secret", "totp_secret_version", "totp_activated_at") VALUES (?, ?, ?, now())',
		[personId, Buffer.from('secret'), 1],
	)
	const claim = (counter: number) => db.commandBus.execute(new ClaimTotpCounterCommand(personId, counter))
	try {
		expect(await claim(1000)).toBe(true)
		expect(await claim(1000)).toBe(false)
		expect(await claim(999)).toBe(false)
		expect(await claim(1001)).toBe(true)

		const parallel = await Promise.all(Array.from({ length: 10 }, () => claim(2000)))
		expect(parallel.filter(it => it)).toHaveLength(1)

		await db.commandBus.execute(new DisableOtpCommand(personId))
		expect(await claim(1500)).toBe(true)
	} finally {
		await db.client.query('DELETE FROM "tenant"."person_mfa" WHERE "person_id" = ?', [personId])
		await db.client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await db.client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
		await connection.end()
	}
})
