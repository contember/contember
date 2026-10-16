import { expect, it } from 'bun:test'
import { MutexDeadlockError, retryTransaction } from '../../../src/utils/index.js'
import { SerializationFailureError } from '../../../src/client/index.js'
import { ClientErrorCodes } from '../../../src/client/errorCodes.js'
import { createConnectionMockAlt } from './createConnectionMockAlt.js'

class PgError extends Error {
	constructor(public readonly code: string) {
		super(`PostgreSQL error ${code}`)
	}
}

it('support nested scope', async () => {
	const [connection, end] = createConnectionMockAlt(
		[{ sql: 'SELECT 1' }],
	)

	await connection.scope(async c1 =>
		await c1.scope(async c2 => {
			await c2.query('SELECT 1')
			return 'foo'
		})
	)
	end()
})

it('another scope acquires new connection', async () => {
	const [connection, end] = createConnectionMockAlt(
		[{ sql: 'SELECT 1', timeout: 5 }, { sql: 'SELECT 2', timeout: 5 }],
		[{ sql: 'SELECT 3', timeout: 5 }],
	)

	await Promise.all([
		connection.scope(async c1 => {
			await c1.query('SELECT 1')
			await c1.query('SELECT 2')
		}),
		connection.scope(async c1 => c1.query('SELECT 3')),
	])
	end()
})

it('another nested scope waits for connection', async () => {
	const [connection, end] = createConnectionMockAlt(
		[{ sql: 'SELECT 1', timeout: 5 }, { sql: 'SELECT 2', timeout: 5 }, { sql: 'SELECT 3', timeout: 5 }],
	)
	await connection.scope(async c1 => {
		await Promise.all([
			c1.scope(async c2 => {
				await c2.query('SELECT 1')
				await c2.query('SELECT 2')
			}),
			c1.scope(async c2 => c2.query('SELECT 3')),
		])
	})
	end()
})

it('another nested scope waits for connection in a transaction', async () => {
	const [connection, end] = createConnectionMockAlt(
		[
			{ sql: 'BEGIN', timeout: 5 },
			{ sql: 'SELECT 1', timeout: 5 },
			{ sql: 'SELECT 2', timeout: 5 },
			{ sql: 'SELECT 3', timeout: 5 },
			{ sql: 'COMMIT', timeout: 5, result: { command: 'COMMIT' } },
		],
	)
	await connection.transaction(async c1 => {
		await Promise.all([
			c1.scope(async c2 => {
				await c2.query('SELECT 1')
				await c2.query('SELECT 2')
			}),
			c1.scope(async c2 => c2.query('SELECT 3')),
		])
	})
	end()
})

it('unscoped queries can pe out of order', async () => {
	const [connection, end] = createConnectionMockAlt(
		[
			{ sql: 'SELECT 1', timeout: 5 },
			{ sql: 'SELECT 3' },
			{ sql: 'SELECT 2' },
		],
	)
	await connection.scope(async c1 => {
		await Promise.all([
			(async () => {
				await c1.query('SELECT 1')
				await c1.query('SELECT 2')
			})(),
			c1.query('SELECT 3'),
		])
	})
	end()
})

it('support nested transaction / savepoints', async () => {
	const [connection, end] = createConnectionMockAlt([
		{ sql: 'BEGIN' },
		{ sql: 'SELECT 1' },
		{ sql: 'SAVEPOINT "savepoint_1"' },
		{ sql: 'SELECT 2' },
		{ sql: 'SAVEPOINT "savepoint_2"' },
		{ sql: 'SELECT 3' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_2"' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_1"' },
		{ sql: 'SELECT 4' },
		{ sql: 'SAVEPOINT "savepoint_3"' },
		{ sql: 'SELECT 5', timeout: 5 },
		{ sql: 'SELECT 6' },
		{ sql: 'SELECT 7' },
		{ sql: 'SELECT 8' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_3"' },
		{ sql: 'SELECT 9' },
		{ sql: 'COMMIT', result: { command: 'COMMIT' } },
	])

	await connection.transaction(async trx => {
		await Promise.all([
			trx.query('SELECT 1'),
			trx.transaction(async trx => {
				await trx.query('SELECT 2')
				await trx.transaction(async trx => {
					await trx.query('SELECT 3')
				})
			}),
			trx.query('SELECT 4'),
			trx.transaction(async trx => {
				await Promise.all([
					trx.scope(async trx => {
						return await Promise.all([
							trx.query('SELECT 5'),
							trx.query('SELECT 6'),
							trx.query('SELECT 7'),
						])
					}),
					trx.query('SELECT 8'),
				])
			}),
			trx.scope(async trx => {
				trx.query('SELECT 9')
			}),
		])
	})
	end()
})

it('detects deadlock', async () => {
	const [connection, end] = createConnectionMockAlt([])

	await expect(connection.scope(async c1 => c1.scope(async () => await c1.query('SELECT 1')))).rejects.toThrow(MutexDeadlockError)
	end()
})

it('rejects closing a transaction twice', async () => {
	const [connection, end] = createConnectionMockAlt(
		[{ sql: 'BEGIN' }, { sql: 'ROLLBACK' }],
	)

	await connection.transaction(async trx => {
		await trx.rollback()
		await expect(trx.rollback()).rejects.toThrow('Transaction is already closed')
		await expect(trx.commit()).rejects.toThrow('Transaction is already closed')
	})
	end()
})

it('rejects closing a savepoint twice', async () => {
	const [connection, end] = createConnectionMockAlt(
		[
			{ sql: 'BEGIN' },
			{ sql: 'SAVEPOINT "savepoint_1"' },
			{ sql: 'RELEASE SAVEPOINT "savepoint_1"' },
			{ sql: 'COMMIT', result: { command: 'COMMIT' } },
		],
	)

	await connection.transaction(async trx => {
		await trx.transaction(async savepoint => {
			await savepoint.commit()
			await expect(savepoint.rollback()).rejects.toThrow('Savepoint savepoint_1 is already closed.')
		})
	})
	end()
})

it('maps a PostgreSQL deadlock to a serialization failure', async () => {
	const [connection, end] = createConnectionMockAlt([{ sql: 'SELECT 1', error: new PgError(ClientErrorCodes.T_R_DEADLOCK_DETECTED) }])

	await expect(connection.query('SELECT 1')).rejects.toBeInstanceOf(SerializationFailureError)
	end()
})

it('retries a transaction aborted by a PostgreSQL deadlock', async () => {
	// a scope that throws disposes its connection, so the retry runs on a new one
	const [connection, end] = createConnectionMockAlt(
		[
			{ sql: 'BEGIN' },
			{ sql: 'UPDATE t SET v = 1', error: new PgError(ClientErrorCodes.T_R_DEADLOCK_DETECTED) },
			{ sql: 'ROLLBACK' },
		],
		[
			{ sql: 'BEGIN' },
			{ sql: 'UPDATE t SET v = 1', result: { rowCount: 1 } },
			{ sql: 'COMMIT', result: { command: 'COMMIT' } },
		],
	)

	let attempts = 0
	await retryTransaction(
		() =>
			connection.transaction(async trx => {
				attempts++
				await trx.query('UPDATE t SET v = 1')
			}),
		() => {},
		{ minTimeout: 0, maxTimeout: 0 },
	)
	expect(attempts).toBe(2)
	end()
})
