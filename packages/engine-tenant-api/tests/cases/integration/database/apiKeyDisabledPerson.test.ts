import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { ApiKey, computeTokenHash, CreateApiKeyCommand, DatabaseContext } from '../../../../src/index.js'
import type { Providers } from '../../../../src/index.js'
import { ApiKeyByTokenQuery } from '../../../../src/model/queries/apiKey/ApiKeyQuery.js'
import { createConnection } from '../../../src/dbUtils.js'

const databaseName = process.env.TEST_DB_NAME ?? ''

const databaseConfigured = Boolean(
	process.env.TEST_DB_HOST
		&& process.env.TEST_DB_PORT
		&& process.env.TEST_DB_USER
		&& process.env.TEST_DB_PASSWORD
		&& databaseName,
)

const createProviders = (uuid: string): Providers => ({
	uuid: () => uuid,
	now: () => new Date(),
	randomBytes: async bytes => Buffer.alloc(bytes),
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: true,
})

test.skipIf(!databaseConfigured)('a key of a disabled person does not authenticate, a key without a person does', async () => {
	const personIdentityId = crypto.randomUUID()
	const keyIdentityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const sessionKeyId = crypto.randomUUID()
	const permanentKeyId = crypto.randomUUID()
	const sessionToken = crypto.randomUUID()
	const permanentToken = crypto.randomUUID()
	const connection = createConnection(databaseName)
	const client = connection.createClient('tenant', { module: 'tenant-disabled-person-test' })

	try {
		for (const identityId of [personIdentityId, keyIdentityId]) {
			await client.query(
				'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
				[identityId, null, JSON.stringify(['person']), 'disabled person test'],
			)
		}
		await client.query('INSERT INTO "tenant"."person" ("id", "identity_id") VALUES (?, ?)', [personId, personIdentityId])
		await new DatabaseContext(client, createProviders(sessionKeyId)).commandBus.execute(
			new CreateApiKeyCommand({ type: ApiKey.Type.SESSION, identityId: personIdentityId, tokenHash: computeTokenHash(sessionToken), expiration: 30 }),
		)
		await new DatabaseContext(client, createProviders(permanentKeyId)).commandBus.execute(
			new CreateApiKeyCommand({ type: ApiKey.Type.PERMANENT, identityId: keyIdentityId, tokenHash: computeTokenHash(permanentToken) }),
		)
		const db = new DatabaseContext(client, createProviders(crypto.randomUUID()))

		expect(await db.queryHandler.fetch(new ApiKeyByTokenQuery(sessionToken))).toMatchObject({ id: sessionKeyId, person_id: personId })

		// The key row itself stays enabled, as for a session issued while `disablePerson` was running.
		await client.query('UPDATE "tenant"."person" SET "disabled_at" = now() WHERE "id" = ?', [personId])

		expect(await db.queryHandler.fetch(new ApiKeyByTokenQuery(sessionToken))).toBeNull()
		expect(await db.queryHandler.fetch(new ApiKeyByTokenQuery(permanentToken))).toMatchObject({ id: permanentKeyId, person_id: null })
	} finally {
		await client.query('DELETE FROM "tenant"."api_key" WHERE "id" IN (?, ?)', [sessionKeyId, permanentKeyId])
		await client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await client.query('DELETE FROM "tenant"."identity" WHERE "id" IN (?, ?)', [personIdentityId, keyIdentityId])
		await connection.end()
	}
})
