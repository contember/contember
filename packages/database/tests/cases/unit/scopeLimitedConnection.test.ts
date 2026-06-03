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

// A connection whose query() can be told to throw, used to verify the slot is released on error/rollback.
const createFailingConnection = (shouldThrow: (sql: string) => boolean): Connection => {
	const pool = new Pool(() => {
		return new class extends EventEmitter {
			connect() {
				return Promise.resolve()
			}

			end() {
				return Promise.resolve()
			}

			async query(sql: string) {
				await timeout(1)
				if (shouldThrow(sql)) {
					throw new Error('boom')
				}
				return { rows: [], rowCount: 0, command: sql === 'COMMIT' ? 'COMMIT' : undefined }
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

it('the (limit+1)th acquisition waits until a slot is released', async () => {
	const connection = createConnection()
	const limited = connection.withMaxConnections(1)

	let firstReleased = false
	let secondStartedBeforeFirstReleased = false

	// hold the only slot open until we explicitly let go
	let releaseFirst!: () => void
	const firstGate = new Promise<void>(resolve => {
		releaseFirst = resolve
	})

	const first = limited.scope(async () => {
		await firstGate
		firstReleased = true
	})

	const second = limited.scope(async () => {
		// if the cap worked, the first slot was already released by the time we get here
		if (!firstReleased) {
			secondStartedBeforeFirstReleased = true
		}
	})

	// give the event loop a chance to (incorrectly) start the second scope
	await timeout(5)
	expect(firstReleased).toBe(false)

	releaseFirst()
	await Promise.all([first, second])

	expect(secondStartedBeforeFirstReleased).toBe(false)
	await connection.end()
})

it('releases the slot when the scope callback throws', async () => {
	const connection = createConnection()
	const limited = connection.withMaxConnections(1)

	await expect(limited.scope(async () => {
		throw new Error('boom')
	})).rejects.toThrow('boom')

	// if the slot had leaked, this would hang until the test times out
	const result = await limited.scope(async () => 'ok')
	expect(result).toBe('ok')
	await connection.end()
})

it('releases the slot when a query inside the scope throws', async () => {
	const connection = createFailingConnection(sql => sql === 'FAIL')
	const limited = connection.withMaxConnections(1)

	await expect(limited.query('FAIL')).rejects.toThrow('boom')

	const result = await limited.query('SELECT 1')
	expect(result.rowCount).toBe(0)
	await connection.end()
})

it('releases the slot when a transaction rolls back', async () => {
	// fail the statement inside the transaction so executeTransaction issues a ROLLBACK and rethrows
	const connection = createFailingConnection(sql => sql === 'FAIL')
	const limited = connection.withMaxConnections(1)

	await expect(limited.transaction(async trx => {
		await trx.query('FAIL')
	})).rejects.toThrow('boom')

	// the slot (and the only allowed connection) must be free again for the next request
	const result = await limited.transaction(async trx => {
		await trx.query('SELECT 1')
		return 'ok'
	})
	expect(result).toBe('ok')
	await connection.end()
})
