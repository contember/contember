import { expect, it } from 'vitest'
import { Connection, Pool } from '../../../src'
import { PgClient } from '../../../src/client/PgClient'
import EventEmitter from 'events'

it('support nested scope', async () => {
	const [connection, end] = createConnectionMock(
		[{ sql: 'SELECT 1' }],
	)

	await connection.scope(async c1 => await c1.scope(async c2 => {
		await c2.query('SELECT 1')
		return 'foo'
	}))
	end()
})

it('another scope acquires new connection', async () => {
	const [connection, end] = createConnectionMock(
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
	const [connection, end] = createConnectionMock(
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
	const [connection, end] = createConnectionMock(
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
	const [connection, end] = createConnectionMock(
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
	const [connection, end] = createConnectionMock([
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


const createConnectionMock = (...queries: { sql: string; timeout?: number }[][]): [Connection, () => void] => {
	const connectionMocks: (PgClient & { assertEmpty: () => void })[] = []
	for (const queriesSet of queries) {
		connectionMocks.push(new class extends EventEmitter {
			connect() {
				return Promise.resolve()
			}

			end() {
				return Promise.resolve()
			}

			async query(sql: string) {
				const query = queriesSet.shift()
				expect(query).toBeDefined()
				expect(sql).toEqual(query?.sql)
				await new Promise<void>(resolve => setTimeout(resolve, query?.timeout ?? 1))

				return sql as any
			}

			assertEmpty() {
				expect(queriesSet).deep.eq([])
			}
		})
	}
	const allMocks = [...connectionMocks]
	const pool = new Pool(() => {
		return connectionMocks.shift() ?? (() => {
			throw new Error('No connection')
		})()
	}, {})
	return [
		new Connection(pool, {}),
		() => {
			allMocks.forEach(it => it.assertEmpty())
		},
	]
}
