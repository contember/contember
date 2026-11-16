import { expect, it } from 'bun:test'
import EventEmitter from 'node:events'
import { Connection, EventManager, InvalidDataError, QueryError, RequestMemoryBudget, RequestMemoryBudgetExceededError } from '../../../src/index.js'
import { AcquiredConnection } from '../../../src/client/AcquiredConnection.js'
import { PgClient } from '../../../src/client/PgClient.js'
import { MutexDeadlockError } from '../../../src/utils/index.js'

const createPgClientMock = (handler: (sql: string) => Promise<any>): PgClient =>
	new class extends EventEmitter {
		readonly host = 'unused'
		readonly port = 5432
		readonly processID = null
		readonly secretKey = null

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

it('refuses a query of an exhausted budget before firing any event', async () => {
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	const eventManager = new EventManager(null, budget, false)
	const recorded = recordEvents(eventManager)
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			recorded.log.push('execute')
			return { rows: [], rowCount: 0 }
		}),
		eventManager,
	)
	expect(() => budget.addHydrationBytes(2048)).toThrow(RequestMemoryBudgetExceededError)

	await expect(connection.query('SELECT 1')).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)

	expect(recorded.log).toStrictEqual([])
})

for (
	const [code, description] of [['22P02', 'invalid text representation'], ['22007', 'invalid datetime format'], ['22008', 'datetime field overflow']]
) {
	it(`translates ${description} (${code}) to InvalidDataError`, async () => {
		const connection = new AcquiredConnection(
			createPgClientMock(async () => {
				throw Object.assign(new Error('invalid input'), { code })
			}),
			new EventManager(),
		)

		await expect(connection.query('SELECT 1')).rejects.toThrow(InvalidDataError)
	})
}

it('puts the PostgreSQL detail and hint of a failed query into the error message', async () => {
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			throw Object.assign(new Error('cannot drop column otp_uri of table person because other objects depend on it'), {
				code: '2BP01',
				detail: 'view app.person_otp depends on column otp_uri of table person',
				hint: 'Use DROP ... CASCADE to drop the dependent objects too.',
			})
		}),
		new EventManager(),
	)

	const error = await connection.query('ALTER TABLE person DROP COLUMN otp_uri').catch(e => e)
	if (!(error instanceof QueryError)) {
		throw error
	}
	expect(error.message).toBe(
		'Database query error: cannot drop column otp_uri of table person because other objects depend on it\n'
			+ 'Detail: view app.person_otp depends on column otp_uri of table person\n'
			+ 'Hint: Use DROP ... CASCADE to drop the dependent objects too.\n'
			+ 'SQL: ALTER TABLE person DROP COLUMN otp_uri\n'
			+ 'parameters: ',
	)
})

it('leaves detail and hint out of the error message when PostgreSQL sends none', async () => {
	const connection = new AcquiredConnection(
		createPgClientMock(async () => {
			throw Object.assign(new Error('relation "missing" does not exist'), { code: '42P01', detail: undefined, hint: undefined })
		}),
		new EventManager(),
	)

	const error = await connection.query('SELECT * FROM missing').catch(e => e)
	if (!(error instanceof QueryError)) {
		throw error
	}
	expect(error.message).toBe('Database query error: relation "missing" does not exist\nSQL: SELECT * FROM missing\nparameters: ')
})
