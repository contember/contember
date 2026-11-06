import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { DatabaseContext, RateLimiter, REAUTHENTICATION_ATTEMPTS } from '../../../../src/index.js'
import { RateLimitScopes } from '../../../../src/model/type/RateLimit.js'
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

test.skipIf(!databaseConfigured)('re-authentication attempts are refused above the limit, also when sent in parallel', async () => {
	const sequentialKey = crypto.randomUUID()
	const parallelKey = crypto.randomUUID()
	const connection = createConnection(databaseName)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant-reauthentication-test' }), providers)
	const limiter = new RateLimiter(providers)
	const reserve = (key: string) => limiter.reserve(db, RateLimitScopes.reauthenticationPerPerson, key, REAUTHENTICATION_ATTEMPTS)
	try {
		for (let i = 0; i < REAUTHENTICATION_ATTEMPTS.limit; i++) {
			expect((await reserve(sequentialKey)).ok).toBe(true)
		}
		expect((await reserve(sequentialKey)).ok).toBe(false)

		const parallel = await Promise.all(Array.from({ length: 20 }, () => reserve(parallelKey)))
		expect(parallel.filter(it => it.ok).length).toBeLessThanOrEqual(REAUTHENTICATION_ATTEMPTS.limit)
	} finally {
		for (const key of [sequentialKey, parallelKey]) {
			await db.client.query('DELETE FROM "tenant"."rate_limit_event" WHERE "scope" = ? AND "key_hash" = ?', [
				RateLimitScopes.reauthenticationPerPerson,
				providers.hash(key, 'sha256'),
			])
		}
		await connection.end()
	}
})
