import { expect, it } from 'vitest'
import { MutexDeadlockError } from '../../../src/utils'
import { createConnectionMockAlt } from './createConnectionMockAlt'

it('support nested scope', async () => {
	const [connection, end] = createConnectionMockAlt(
		[{ sql: 'SELECT 1' }],
	)

	await connection.scope(async c1 => await c1.scope(async c2 => {
		await c2.query('SELECT 1')
		return 'foo'
	}))
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
			{ sql: 'COMMIT', timeout: 5 },
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
		{ sql: 'COMMIT' },
	],
	)

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

	await expect(async () => await connection.scope(async c1 => c1.scope(async () => await c1.query('SELECT 1')))).rejects.toThrow(MutexDeadlockError)
	end()
})

