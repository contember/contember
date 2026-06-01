import { expect, it } from 'bun:test'
import { Connection, Pool } from '../../../src/index.js'
import { PgClient } from '../../../src/client/PgClient.js'
import EventEmitter from 'node:events'

const timeout = async (ms = 1) => await new Promise<void>(resolve => setTimeout(resolve, ms))

const createConnection = (): Connection => {
	const pool = new Pool(() => {
		return new class extends EventEmitter {
			connect() {
				return Promise.resolve()
			}

			end() {
				return Promise.resolve()
			}

			async query() {
				await timeout(5)
				return { rows: [], rowCount: 0 }
			}
		}() as unknown as PgClient
	}, { maxConnections: 10, logError: () => null })
	return new Connection(pool)
}

it('limits concurrent connections per scope', async () => {
	const connection = createConnection()
	const limited = connection.withMaxConnections(2)

	let active = 0
	let maxActive = 0

	const work = async () => {
		await limited.scope(async c => {
			active++
			maxActive = Math.max(maxActive, active)
			await c.query('SELECT 1')
			active--
		})
	}

	await Promise.all([work(), work(), work(), work(), work()])

	expect(maxActive).toBe(2)
	await connection.end()
})

it('does not limit when used without a wrapper', async () => {
	const connection = createConnection()

	let active = 0
	let maxActive = 0

	const work = async () => {
		await connection.scope(async c => {
			active++
			maxActive = Math.max(maxActive, active)
			await c.query('SELECT 1')
			active--
		})
	}

	await Promise.all([work(), work(), work(), work(), work()])

	expect(maxActive).toBe(5)
	await connection.end()
})

it('nested scopes do not count against the limit (no deadlock)', async () => {
	const connection = createConnection()
	const limited = connection.withMaxConnections(1)

	const result = await limited.scope(async c1 => {
		// nested scope reuses the already-acquired connection, so it must not block
		return await c1.scope(async c2 => {
			await c2.query('SELECT 1')
			return 'ok'
		})
	})

	expect(result).toBe('ok')
	await connection.end()
})

it('queues work beyond the limit and eventually completes all', async () => {
	const connection = createConnection()
	const limited = connection.withMaxConnections(2)

	let completed = 0
	const work = async () => {
		await limited.query('SELECT 1')
		completed++
	}

	await Promise.all(Array.from({ length: 6 }, () => work()))

	expect(completed).toBe(6)
	await connection.end()
})
