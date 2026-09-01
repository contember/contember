import { expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { computeTokenHash, DatabaseContext, Providers, SavePersonTokenCommand } from '../../../src/index.js'

const APP_NOW = new Date('2026-07-14T10:00:00Z')
const DB_EXPIRES_AT = new Date('2026-07-14T09:15:00Z')
const TOKEN_HASH = computeTokenHash('token')

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => APP_NOW,
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => 'token-id',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: () => Buffer.alloc(0),
}

test('returns the database-clock expiration', async () => {
	const queries: ExpectedQuery[] = [{
		sql:
			`insert into "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "meta") values (?, ?, ?, now() + make_interval(secs => ?), ?, ?, ?, ?) returning "expires_at"`,
		parameters: ['token-id', TOKEN_HASH, 'person-id', 900, APP_NOW, null, 'passwordless', null],
		response: { rows: [{ expires_at: DB_EXPIRES_AT }] },
	}]
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, providers)

	const result = await db.commandBus.execute(new SavePersonTokenCommand('person-id', TOKEN_HASH, 'passwordless', 15))

	expect(result).toEqual({ id: 'token-id', expiresAt: DB_EXPIRES_AT })
	expect(queries).toHaveLength(0)
})
