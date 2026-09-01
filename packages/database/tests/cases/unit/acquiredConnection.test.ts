import { expect, it } from 'bun:test'
import EventEmitter from 'node:events'
import { Connection, EventManager, QueryError } from '../../../src/index.js'
import { AcquiredConnection } from '../../../src/client/AcquiredConnection.js'
import { PgClient } from '../../../src/client/PgClient.js'
import { MutexDeadlockError } from '../../../src/utils/index.js'

const createPgClientMock = (handler: (sql: string) => Promise<any>): PgClient =>
	new class extends EventEmitter {
		connect() {
			return Promise.resolve()
		}

		end() {
			return Promise.resolve()
		}

		async query(sql: string): Promise<any> {
			return await handler(sql)
		}
	}()

interface RecordedEvents {
	log: string[]
	starts: Connection.Query[]
	ends: Connection.Query[]
	errors: Connection.Query[]
}

const recordEvents = (eventManager: EventManager): RecordedEvents => {
	const recorded: RecordedEvents = { log: [], starts: [], ends: [], errors: [] }
	eventManager.on(EventManager.Event.queryStart, query => {
		recorded.log.push(`start ${query.sql}`)
		recorded.starts.push(query)
	})
	eventManager.on(EventManager.Event.queryEnd, query => {
		recorded.log.push(`end ${query.sql}`)
		recorded.ends.push(query)
	})
	eventManager.on(EventManager.Event.queryError, query => {
		recorded.log.push(`error ${query.sql}`)
		recorded.errors.push(query)
	})
	return recorded
}

it('fires queryEnd with the same event object as queryStart', async () => {
	const eventManager = new EventManager()
	const recorded = recordEvents(eventManager)
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			recorded.log.push('execute')
			return { rows: [], rowCount: 0 }
		}),
		eventManager,
	)

	await connection.query('SELECT 1')

	expect(recorded.log).toStrictEqual(['start SELECT 1', 'execute', 'end SELECT 1'])
	expect(recorded.starts).toHaveLength(1)
	expect(recorded.ends[0]).toBe(recorded.starts[0])
	expect(recorded.errors).toStrictEqual([])
})

it('fires queryError with the same event object as queryStart', async () => {
	const eventManager = new EventManager()
	const recorded = recordEvents(eventManager)
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			recorded.log.push('execute')
			throw new Error('query failed')
		}),
		eventManager,
	)

	await expect(connection.query('SELECT 1')).rejects.toThrow(QueryError)

	expect(recorded.log).toStrictEqual(['start SELECT 1', 'execute', 'error SELECT 1'])
	expect(recorded.starts).toHaveLength(1)
	expect(recorded.errors[0]).toBe(recorded.starts[0])
	expect(recorded.ends).toStrictEqual([])
})

it('fires queryStart before waiting for the connection mutex', async () => {
	const eventManager = new EventManager()
	const recorded = recordEvents(eventManager)
	let unblock: () => void = () => null
	const blocker = new Promise<void>(resolve => {
		unblock = resolve
	})
	const connection = new AcquiredConnection(
		createPgClientMock(async sql => {
			if (sql === 'SELECT 1') {
				await blocker
			}
			return { rows: [], rowCount: 0 }
		}),
		eventManager,
	)

	const first = connection.query('SELECT 1')
	const second = connection.query('SELECT 2')

	expect(recorded.log).toStrictEqual(['start SELECT 1', 'start SELECT 2'])

	unblock()
	await Promise.all([first, second])

	expect(recorded.log).toStrictEqual(['start SELECT 1', 'start SELECT 2', 'end SELECT 1', 'end SELECT 2'])
	expect(recorded.ends[0]).toBe(recorded.starts[0])
	expect(recorded.ends[1]).toBe(recorded.starts[1])
})

it('fires queryError when the mutex deadlocks', async () => {
	const eventManager = new EventManager()
	const recorded = recordEvents(eventManager)
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			recorded.log.push('execute')
			return { rows: [], rowCount: 0 }
		}),
		eventManager,
	)

	await expect(connection.scope(async () => await connection.query('SELECT 1'))).rejects.toThrow(MutexDeadlockError)

	expect(recorded.log).toStrictEqual(['start SELECT 1', 'error SELECT 1'])
	expect(recorded.errors[0]).toBe(recorded.starts[0])
	expect(recorded.ends).toStrictEqual([])
})
