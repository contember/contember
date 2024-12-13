import { describe, expect, test } from 'bun:test'
import { WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler'
import { FetcherResponse } from '../../../src/dispatch/WebhookFetcher'
import { createLogger, Logger, TestLoggerHandler } from '@contember/logger'
import { EventRow } from '../../../src/model/types'
import { Actions, ActionsPayload } from '@contember/schema'
import { HandledEvent } from '../../../src/dispatch/types'
import { testUuid } from '../../src/uuid'


const assert = {
	equal: (a: any, b: any) => expect(a).toEqual(b),
	deepStrictEqual: (a: any, b: any) => expect(a).toStrictEqual(b),
}
const now = new Date('2024-06-20T12:00:00Z')
const createTestEvent = (i = 0, row: Partial<EventRow> = {}): EventRow => ({
	created_at: now,
	id: testUuid(i * 10 + 1),
	trigger: 'test',
	target: 'test_target',
	last_state_change: now,
	log: [],
	num_retries: 0,
	resolved_at: null,
	transaction_id: testUuid(i * 10 + 2),
	stage_id: testUuid(i * 10 + 3),
	visible_at: now,
	payload: { foo: 'bar' } as unknown as ActionsPayload.AnyEventPayload,
	priority: 1,
	schema_id: 1,
	state: 'created',
	...row,
})

const dropDuration = (events: HandledEvent[]): HandledEvent[] => {
	return events.map(it => ({ ...it, result: { ...it.result, durationMs: -1 } }))
}

const okResponse = Promise.resolve({
	ok: true,
	headers: new Headers(),
	responseText: '',
	status: 200,
	statusText: 'OK',
})

describe('webhook request', () => {
	test('default request', async () => {
		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')
				assert.equal(init.body, JSON.stringify({
					events: [{
						meta: {
							eventId: testUuid(1),
							transactionId: testUuid(2),
							createdAt: now.toISOString(),
							lastStateChange: now.toISOString(),
							numRetries: 0,
							trigger: 'test',
							target: 'test_target',
						},
						foo: 'bar',
					}],
				}))

				return okResponse
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		await webhookHandler.handle({
			logger: {
				warn: (e: any) => {
					throw e
				},
			} as unknown as Logger,
			target: target,
			events: [event1],
			variables: {},
		})
		assert.equal(fetchCalled, true)
	})

	test('custom body', async () => {
		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')
				assert.equal(init.body, JSON.stringify({
					options: 'value',
					payload: {
						json: {
							events: [{
								meta: {
									eventId: testUuid(1),
									transactionId: testUuid(2),
									createdAt: now.toISOString(),
									lastStateChange: now.toISOString(),
									numRetries: 0,
									trigger: 'test',
									target: 'test_target',
								},
								foo: 'bar',
							}],
						},
					},
				}))

				return okResponse
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
			body: {
				options: 'value',
			},
			payloadPath: ['payload', 'json'],
		}

		const event1 = createTestEvent(0)
		await webhookHandler.handle({
			logger: {
				warn: (e: any) => {
					throw e
				},
			} as unknown as Logger,
			target: target,
			events: [event1],
			variables: {},
		})
		assert.equal(fetchCalled, true)
	})
})
describe('webhook response', () => {
	test('successful response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')

				return okResponse
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		const event2 = createTestEvent(1)
		const result = await webhookHandler.handle({
			logger,
			target: target,
			events: [event1, event2],
			variables: {},
		})
		assert.equal(fetchCalled, true)
		assert.deepStrictEqual(dropDuration(result), [
			{
				row: event1,
				target,
				result: {
					ok: true,
					code: 200,
					durationMs: -1,
				},
			},
			{
				row: event2,
				target,
				result: {
					ok: true,
					code: 200,
					durationMs: -1,
				},
			},
		])
	})

	test('error response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')

				return Promise.resolve({
					ok: false,
					headers: new Headers(),
					responseText: 'Failed to something',
					status: 500,
					statusText: 'Err',
				})
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		const event2 = createTestEvent(1)
		const result = await webhookHandler.handle({
			logger,
			target: target,
			events: [event1, event2],
			variables: {},
		})
		assert.equal(fetchCalled, true)
		assert.deepStrictEqual(dropDuration(result), [
			{
				row: event1,
				target,
				result: {
					ok: false,
					code: 500,
					durationMs: -1,
					errorMessage: 'Err',
					response: 'Failed to something',
				},
			},
			{
				row: event2,
				target,
				result: {
					ok: false,
					code: 500,
					durationMs: -1,
					errorMessage: 'Err',
					response: 'Failed to something',
				},
			},
		])
	})


	test('invalid partial response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')

				return Promise.resolve({
					ok: true,
					headers: new Headers([['content-type', 'application/json']]),
					responseText: `{"failures": [{}]}`,
					status: 200,
					statusText: 'OK',
				})
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		const event2 = createTestEvent(1)
		const result = await webhookHandler.handle({
			logger,
			target: target,
			events: [event1, event2],
			variables: {},
		})
		assert.equal(fetchCalled, true)
		assert.deepStrictEqual(dropDuration(result), [
			{
				row: event1,
				target,
				result: {
					ok: false,
					code: 200,
					durationMs: -1,
					errorMessage: 'Invalid response: value at path /failures/0/eventId: must be string, undefined given',
					response: '{"failures": [{}]}',
				},
			},
			{
				row: event2,
				target,
				result: {
					ok: false,
					code: 200,
					durationMs: -1,
					errorMessage: 'Invalid response: value at path /failures/0/eventId: must be string, undefined given',
					response: '{"failures": [{}]}',
				},
			},
		])
	})


	test('ignored invalid response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')

				return Promise.resolve({
					ok: true,
					headers: new Headers([['content-type', 'application/json']]),
					responseText: `{"success": true}`,
					status: 200,
					statusText: 'OK',
				})
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		const event2 = createTestEvent(1)
		const result = await webhookHandler.handle({
			logger,
			target: target,
			events: [event1, event2],
			variables: {},
		})
		assert.equal(fetchCalled, true)
		assert.deepStrictEqual(dropDuration(result), [
			{
				row: event1,
				target,
				result: {
					ok: true,
					code: 200,
					durationMs: -1,
				},
			},
			{
				row: event2,
				target,
				result: {
					ok: true,
					code: 200,
					durationMs: -1,
				},
			},
		])
	})

	test('partially successful response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = new WebhookTargetHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')

				return Promise.resolve({
					ok: true,
					headers: new Headers([['content-type', 'application/json']]),
					responseText: `{"failures": [{"eventId": "${testUuid(1)}", "error": "foo failure"}]}`,
					status: 200,
					statusText: 'OK',
				})
			},
		})

		const target: Actions.AnyTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
		}

		const event1 = createTestEvent(0)
		const event2 = createTestEvent(1)
		const result = await webhookHandler.handle({
			logger,
			target: target,
			events: [event1, event2],
			variables: {},
		})
		assert.equal(fetchCalled, true)
		assert.deepStrictEqual(dropDuration(result), [
			{
				row: event1,
				target,
				result: {
					ok: false,
					code: 200,
					durationMs: -1,
					errorMessage: 'foo failure',
				},
			},
			{
				row: event2,
				target,
				result: {
					ok: true,
					code: 200,
					durationMs: -1,
				},
			},
		])
	})
})
