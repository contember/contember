import { describe, expect, test } from 'bun:test'
import { UndefinedVariableError, WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler.js'
import { FetcherResponse, WebhookFetcher } from '../../../src/dispatch/WebhookFetcher.js'
import { noopTracer } from '@contember/telemetry'
import { createLogger, Logger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { HandledEvent } from '../../../src/dispatch/types.js'
import { testUuid } from '../../src/uuid.js'
import { createTestEvent, testEventTime } from '../../src/event.js'

const assert = {
	equal: (a: any, b: any) => expect(a).toEqual(b),
	deepStrictEqual: (a: any, b: any) => expect(a).toStrictEqual(b),
}
const now = testEventTime

const createHandler = (fetcher: WebhookFetcher) => new WebhookTargetHandler(fetcher, noopTracer, { propagateToWebhooks: true })

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
		const webhookHandler = createHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')
				assert.equal(
					init.body,
					JSON.stringify({
						events: [{
							meta: {
								eventId: testUuid(1),
								transactionId: testUuid(2),
								identityId: testUuid(4),
								ipAddress: '127.0.0.1',
								userAgent: 'test-agent',
								createdAt: now.toISOString(),
								lastStateChange: now.toISOString(),
								numRetries: 0,
								trigger: 'test',
								target: 'test_target',
							},
							foo: 'bar',
						}],
					}),
				)

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
		const webhookHandler = createHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				fetchCalled = true
				assert.equal(url, 'http://localhost')
				assert.equal(
					init.body,
					JSON.stringify({
						options: 'value',
						payload: {
							json: {
								events: [{
									meta: {
										eventId: testUuid(1),
										transactionId: testUuid(2),
										identityId: testUuid(4),
										ipAddress: '127.0.0.1',
										userAgent: 'test-agent',
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
					}),
				)

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
describe('webhook variables', () => {
	const target: Actions.WebhookTarget = {
		name: 'test_target',
		type: 'webhook',
		url: 'http://{{HOST}}/{{PATH}}',
		headers: { Authorization: 'Bearer {{TOKEN}}', 'X-Path': '{{PATH}}' },
	}

	test('interpolates variables into the URL and headers', async () => {
		const requests: { url: string; headers: Headers }[] = []
		const webhookHandler = createHandler({
			fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				requests.push({ url, headers: new Headers(init.headers) })
				return okResponse
			},
		})

		await webhookHandler.handle({
			logger: createLogger(new TestLoggerHandler()),
			target,
			events: [createTestEvent(0)],
			variables: { HOST: 'example.com', PATH: 'hook', TOKEN: 'secret' },
		})

		assert.equal(requests.length, 1)
		assert.equal(requests[0].url, 'http://example.com/hook')
		assert.equal(requests[0].headers.get('Authorization'), 'Bearer secret')
		assert.equal(requests[0].headers.get('X-Path'), 'hook')
	})

	test('throws a typed error naming every undefined variable before any request', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		let fetchCalled = false
		const webhookHandler = createHandler({
			fetch(): Promise<FetcherResponse> {
				fetchCalled = true
				return okResponse
			},
		})

		const error = await webhookHandler.handle({
			logger: createLogger(testLoggerHandler),
			target: { ...target, url: 'http://{{HOST}}/{{constructor}}/{{PATH}}' },
			events: [createTestEvent(0)],
			// an empty value counts as undefined, and so does a name an object inherits
			variables: { HOST: 'example.com', PATH: '' },
		}).then(() => null, (e: unknown) => e)

		expect(error).toBeInstanceOf(UndefinedVariableError)
		expect(error instanceof UndefinedVariableError ? error.variables : null).toStrictEqual(['constructor', 'PATH', 'TOKEN'])
		assert.equal(fetchCalled, false)
		// the dispatcher reports it once for the whole target, the handler stays quiet
		assert.deepStrictEqual(testLoggerHandler.messages, [])
	})

	test('a failed request is logged and stored without the credentials its URL and headers carry', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const webhookHandler = createHandler({
			async fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
				const authorization = new Headers(init.headers).get('Authorization')
				throw Object.assign(new TypeError(`Failed to parse URL from ${url}`), {
					cause: Object.assign(new TypeError(`Headers.append: "${authorization}" is an invalid header value.`), {
						cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443 after sending token-3 and static-header-key'), {
							code: 'ECONNREFUSED',
							url,
						}),
					}),
				})
			},
		})

		const result = await webhookHandler.handle({
			logger: createLogger(testLoggerHandler),
			target: {
				...target,
				url: 'https://deliveries:{{PASSWORD}}@example.com:8443/hooks/{{PATH}}?key=static-key#fragment',
				headers: { Authorization: 'Bearer {{TOKEN}}', 'X-Api-Key': 'static-header-key' },
			},
			events: [createTestEvent(0)],
			variables: { PASSWORD: 'pw-1', PATH: 'path-2', TOKEN: 'token-3' },
		})

		const reason = 'Failed to parse URL from https://[redacted]@example.com:8443/[redacted]; '
			+ 'Headers.append: "[redacted]" is an invalid header value.; '
			+ 'connect ECONNREFUSED 127.0.0.1:443 after sending [redacted] and [redacted]'
		assert.deepStrictEqual(result.map(it => it.result.errorMessage), [reason])
		assert.deepStrictEqual(testLoggerHandler.messages.map(it => [it.level.name, it.message, it.ownAttributes]), [
			['warn', `Webhook request failed: ${reason}`, { target: 'test_target' }],
		])
		const error = testLoggerHandler.messages[0].error
		expect(error).toBeInstanceOf(Error)
		expect(error).toHaveProperty('name', 'TypeError')
		expect(error).toHaveProperty('code', 'ECONNREFUSED')
		expect(error).not.toHaveProperty('cause')
		const logged = JSON.stringify([error, error instanceof Error ? error.stack : null])
		for (const secret of ['deliveries', 'pw-1', 'hooks', 'path-2', 'static-key', 'fragment', 'token-3', 'static-header-key']) {
			expect(logged).not.toContain(secret)
		}
	})
})

describe('webhook response', () => {
	test('successful response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = createHandler({
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
		assert.deepStrictEqual(testLoggerHandler.messages, [])
	})

	test('error response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = createHandler({
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

		const warnings = testLoggerHandler.messages.filter(it => it.level.name === 'warn')
		assert.equal(warnings.length, 1)
		assert.equal(warnings[0].message, 'Webhook target responded with an error status')
		// exact match: neither the URL nor the headers may end up in the log
		assert.deepStrictEqual(warnings[0].ownAttributes, {
			target: 'test_target',
			status: 500,
			statusText: 'Err',
			events: [event1.id, event2.id],
		})
	})

	test('invalid partial response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = createHandler({
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

		const warnings = testLoggerHandler.messages.filter(it => it.level.name === 'warn')
		assert.equal(warnings.length, 1)
		assert.equal(warnings[0].message, 'Webhook target returned a malformed response')
		// exact match: the parser message quotes the payload and must not reach the log
		assert.deepStrictEqual(warnings[0].ownAttributes, {
			target: 'test_target',
			status: 200,
			events: [event1.id, event2.id],
		})
	})

	test('response naming events outside the batch', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		const webhookHandler = createHandler({
			fetch(): Promise<FetcherResponse> {
				return Promise.resolve({
					ok: true,
					headers: new Headers([['content-type', 'application/json']]),
					responseText: `{"failures": [{"eventId": "${testUuid(999)}"}]}`,
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
		assert.equal(result.every(it => !it.result.ok), true)

		const warnings = testLoggerHandler.messages.filter(it => it.level.name === 'warn')
		assert.equal(warnings.length, 1)
		assert.equal(warnings[0].message, 'Webhook target reported failures for event ids outside the batch')
		// exact match: the unknown ids are strings the target chose, only their count may be logged
		assert.deepStrictEqual(warnings[0].ownAttributes, {
			target: 'test_target',
			status: 200,
			unknownEventIds: 1,
			events: [event1.id, event2.id],
		})
	})

	test('ignored invalid response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = createHandler({
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
		assert.deepStrictEqual(testLoggerHandler.messages, [])
	})

	test('partially successful response', async () => {
		const testLoggerHandler = new TestLoggerHandler()
		const logger = createLogger(testLoggerHandler)

		let fetchCalled = false
		const webhookHandler = createHandler({
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

		const warnings = testLoggerHandler.messages.filter(it => it.level.name === 'warn')
		assert.equal(warnings.length, 1)
		assert.equal(warnings[0].message, 'Webhook target reported failed events')
		// exact match: only the events the target rejected, never the reasons it gave
		assert.deepStrictEqual(warnings[0].ownAttributes, {
			target: 'test_target',
			status: 200,
			events: [event1.id],
		})
	})
})
