import { expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { SerializationFailureError } from '@contember/database'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { DatabaseContext } from '../../../src/index'
import { Providers } from '../../../src/model/providers'

// Every tenant transaction runs at repeatable read, so postgres aborts it with a 40001 as soon as another
// transaction commits to a row it wants — the api_key row disablePerson touches is written by that very
// person's background session tracking. Repeating is the only correct answer, but it is opt-in: several
// managers send a mail from inside their transaction and would send it twice.

const providers: Providers = {
	uuid: () => '11111111-1111-1111-1111-111111111111',
	now: () => new Date('2026-01-01T00:00:00Z'),
	randomBytes: length => Promise.resolve(Buffer.alloc(length)),
	bcrypt: value => Promise.resolve(value),
	bcryptCompare: (data, encrypted) => Promise.resolve(data === encrypted),
	hash: value => Buffer.from(String(value)),
	encrypt: () => {
		throw new Error('not supported')
	},
	decrypt: () => {
		throw new Error('not supported')
	},
}

const serializationFailure = () =>
	new SerializationFailureError('update "tenant"."api_key" set "disabled_at" = $1 where "identity_id" = $2', [], {
		code: '40001',
		message: 'could not serialize access due to concurrent update',
	})

const begin: ExpectedQuery[] = [
	{ sql: 'BEGIN;', response: { rowCount: 1 } },
	{ sql: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ', response: { rowCount: 1 } },
]
const commit: ExpectedQuery = { sql: 'COMMIT;', response: { rowCount: 1 } }

const createDbContext = (queries: ExpectedQuery[]) => {
	const connection = createConnectionMock(queries)
	return new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)
}

test('transaction with retry repeats the whole transaction after a serialization failure', async () => {
	const queries = [...begin, ...begin, commit]
	const dbContext = createDbContext(queries)
	const handler = new TestLoggerHandler()
	let attempts = 0

	const result = await dbContext.transaction(async () => {
		attempts++
		if (attempts === 1) {
			throw serializationFailure()
		}
		return 'done'
	}, { retry: { logger: createLogger(handler) } })

	expect(result).toBe('done')
	expect(attempts).toBe(2)
	// The second attempt opens its own transaction, so it gets a fresh snapshot — a retry on the same one
	// would abort again forever.
	expect(queries).toHaveLength(0)
	// Logged through the injected logger, not an ambient one — a retry must not depend on request-scoped state.
	expect(handler.messages).toHaveLength(1)
	expect(handler.messages[0].message).toMatch(/^RETRY: Serialization failure \(attempt #1/)
})

test('transaction without retry lets the serialization failure through', async () => {
	const dbContext = createDbContext([...begin])
	let attempts = 0

	const run = dbContext.transaction(async () => {
		attempts++
		throw serializationFailure()
	})

	await expect(run).rejects.toBeInstanceOf(SerializationFailureError)
	expect(attempts).toBe(1)
})
