import { expect, it } from 'bun:test'
import { Connection, PinnedConnection, Pool } from '../../../src/index.js'
import EventEmitter from 'node:events'

const timeout = async (ms = 1) => await new Promise<void>(resolve => setTimeout(resolve, ms))

/** Records every statement and how many physical clients the pool had to create. */
const createConnection = () => {
	const queries: string[] = []
	let created = 0
	class FakePgClient extends EventEmitter {
		async connect() {}

		async end() {}

		async query(sql: string) {
			queries.push(sql)
			await timeout(1)
			return { rows: [], rowCount: 0, command: sql === 'COMMIT' ? 'COMMIT' : 'SELECT', oid: 0, fields: [] }
		}
	}
	const pool = new Pool(() => {
		created++
		return new FakePgClient()
	}, { maxConnections: 10, logError: () => null })
	return { connection: new Connection(pool), queries, getCreated: () => created }
}

it('runs queries on the pinned connection instead of acquiring a new one', async () => {
	const { connection, queries, getCreated } = createConnection()

	await connection.scope(async acquired => {
		const pinned = new PinnedConnection(acquired, connection)
		await pinned.query('SELECT 1')
		await pinned.query('SELECT 2')
	})

	expect(queries).toStrictEqual(['SELECT 1', 'SELECT 2'])
	expect(getCreated()).toBe(1)
	await connection.end()
})

it('a client created from it reaches the pinned connection', async () => {
	const { connection, queries, getCreated } = createConnection()

	await connection.scope(async acquired => {
		const pinned = new PinnedConnection(acquired, connection)
		const client = pinned.createClient('content', { module: 'content' })
		await client.query('SELECT 3')
	})

	expect(queries).toStrictEqual(['SELECT 3'])
	expect(getCreated()).toBe(1)
	await connection.end()
})

it('supports scopes and transactions without leaving the pinned connection', async () => {
	const { connection, queries, getCreated } = createConnection()

	const result = await connection.scope(async acquired => {
		const pinned = new PinnedConnection(acquired, connection)
		return await pinned.transaction(async trx => {
			await trx.query('SELECT 4')
			return await trx.scope(async nested => {
				await nested.query('SELECT 5')
				return 'ok'
			})
		})
	})

	expect(result).toBe('ok')
	expect(queries).toStrictEqual(['BEGIN', 'SELECT 4', 'SELECT 5', 'COMMIT'])
	expect(getCreated()).toBe(1)
	await connection.end()
})

it('exposes the event manager and the pool status of the underlying pool', async () => {
	const { connection } = createConnection()

	await connection.scope(async acquired => {
		const pinned = new PinnedConnection(acquired, connection)
		expect(pinned.eventManager).toBe(acquired.eventManager)
		expect(pinned.getPoolStatus()).toStrictEqual(connection.getPoolStatus())
	})

	await connection.end()
})
