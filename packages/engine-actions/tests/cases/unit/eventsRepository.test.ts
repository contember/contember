import { describe, expect, test } from 'bun:test'
import { Client, Connection, EventManager } from '@contember/database'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { EventsRepository } from '../../../src/dispatch/EventsRepository.js'
import { HandledEvent } from '../../../src/dispatch/types.js'
import { createTestEvent } from '../../src/event.js'
import { testUuid } from '../../src/uuid.js'

/**
 * Answers statements from a script, then with an empty result, so what is under test is the
 * repository's own bookkeeping rather than any SQL.
 */
const createStubClient = (responses: Connection.Result[] = []): Client => {
	const remaining = [...responses]
	const eventManager = new EventManager()
	const query = async <Row extends Record<string, any>>(): Promise<Connection.Result<Row>> => {
		const next = remaining.shift() ?? { rowCount: 0, rows: [] }
		return { rowCount: next.rowCount, rows: next.rows as Row[] }
	}
	const transaction: Connection.TransactionLike = {
		eventManager,
		isClosed: false,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
		on: () => () => {},
		rollback: async () => {},
		commit: async () => {},
	}
	const connection: Connection.ConnectionLike = {
		eventManager,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
	}
	return new Client(connection, 'system', {})
}

const target: Actions.WebhookTarget = {
	name: 'test_target',
	type: 'webhook',
	url: 'http://localhost',
	maxAttempts: 3,
}

const createFailedEvent = (numRetries: number): HandledEvent => ({
	row: createTestEvent(0, { num_retries: numRetries, state: 'processing' }),
	target,
	result: { ok: false, code: 401, errorMessage: 'Unauthorized' },
})

const errorsOf = (handler: TestLoggerHandler) => handler.messages.filter(it => it.level.name === 'error')

describe('persistProcessed', () => {
	test('logs an error when the last attempt fails', async () => {
		const testLoggerHandler = new TestLoggerHandler()

		const result = await new EventsRepository().persistProcessed(
			createStubClient(),
			[createFailedEvent(2)],
			createLogger(testLoggerHandler),
		)

		expect(result).toEqual({ succeeded: 0, retried: 0, failed: 1 })
		const errors = errorsOf(testLoggerHandler)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toBe('Action event failed permanently, no attempts left')
		// exact match: neither the target URL nor its headers may end up in the log
		expect(errors[0].ownAttributes).toStrictEqual({
			eventId: testUuid(1),
			target: 'test_target',
			trigger: 'test',
			attempts: 3,
			code: 401,
			errorMessage: 'Unauthorized',
		})
	})

	test('stays quiet while attempts remain', async () => {
		const testLoggerHandler = new TestLoggerHandler()

		const result = await new EventsRepository().persistProcessed(
			createStubClient(),
			[createFailedEvent(0)],
			createLogger(testLoggerHandler),
		)

		expect(result).toEqual({ succeeded: 0, retried: 1, failed: 0 })
		expect(errorsOf(testLoggerHandler)).toHaveLength(0)
	})
})

describe('fetchBatch', () => {
	const eventRow = createTestEvent(0, { state: 'processing' })

	test('logs an error when the event names a target the schema does not have', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const client = createStubClient([
			{ rowCount: 1, rows: [eventRow] },
			{ rowCount: 1, rows: [] },
		])

		const result = await new EventsRepository().fetchBatch(
			{ triggers: {}, targets: {} },
			client,
			createLogger(testLoggerHandler),
		)

		expect(result).toEqual({ ok: false, backoffMs: undefined, unknownTargetFailed: 1 })
		const errors = errorsOf(testLoggerHandler)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toBe('Action event failed permanently, its target is not in the schema')
		expect(errors[0].ownAttributes).toStrictEqual({
			eventId: testUuid(1),
			target: 'test_target',
			trigger: 'test',
		})
	})

	test('stays quiet when the target is in the schema', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const client = createStubClient([
			{ rowCount: 1, rows: [eventRow] },
		])

		const result = await new EventsRepository().fetchBatch(
			{ triggers: {}, targets: { test_target: target } },
			client,
			createLogger(testLoggerHandler),
		)

		expect(result).toEqual({ ok: true, events: [eventRow], target, unknownTargetFailed: 0 })
		expect(testLoggerHandler.messages).toStrictEqual([])
	})
})
