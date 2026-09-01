import { expect, test } from 'bun:test'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { Actions } from '@contember/schema'
import { formatTraceparent, ReadableSpan, withSpanContext } from '@contember/telemetry'
import { FetcherResponse, WebhookFetcher } from '../../../src/dispatch/WebhookFetcher.js'
import { WebhookTargetHandler } from '../../../src/dispatch/WebhookTargetHandler.js'
import { createTestEvent } from '../../src/event.js'
import { createRecordingTracer } from '../../src/tracer.js'

const okResponse: FetcherResponse = {
	ok: true,
	headers: new Headers(),
	responseText: '',
	status: 200,
	statusText: 'OK',
}

const createFetcher = (respond: () => Promise<FetcherResponse> = async () => okResponse) => {
	const calls: { url: string; headers: Headers }[] = []
	const fetcher: WebhookFetcher = {
		fetch: async (url, init) => {
			calls.push({ url, headers: new Headers(init.headers) })
			return await respond()
		},
	}
	return { calls, fetcher }
}

const createTarget = (headers?: Record<string, string>): Actions.WebhookTarget => ({
	name: 'test_target',
	type: 'webhook',
	url: 'http://localhost/hook?token=secret',
	...(headers !== undefined ? { headers } : {}),
})

const handle = async (handler: WebhookTargetHandler, target: Actions.WebhookTarget) =>
	await handler.handle({
		target,
		events: [createTestEvent(0), createTestEvent(1)],
		logger: createLogger(new TestLoggerHandler()),
		variables: {},
	})

const webhookSpanOf = (spans: readonly ReadableSpan[]): ReadableSpan => {
	const span = spans.find(it => it.name === 'webhook')
	if (span === undefined) {
		throw new Error('no webhook span was exported')
	}
	return span
}

test('webhook: the outgoing request carries the traceparent of the webhook span', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const { calls, fetcher } = createFetcher()
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true })

	await handle(handler, createTarget())
	await flush()

	expect(calls).toHaveLength(1)
	expect(calls[0].headers.get('traceparent')).toBe(formatTraceparent(webhookSpanOf(exporter.spans).context))
	expect(calls[0].headers.get('tracestate')).toBeNull()
})

test('webhook: tracestate is forwarded from the incoming trace', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const { calls, fetcher } = createFetcher()
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true })
	const incoming = {
		traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
		spanId: '00f067aa0ba902b7',
		traceFlags: 1,
		traceState: 'vendor=1',
	}

	await withSpanContext(incoming, async () => await handle(handler, createTarget()))
	await flush()

	const span = webhookSpanOf(exporter.spans)
	expect(span.parentSpanId).toBe(incoming.spanId)
	expect(calls[0].headers.get('traceparent')).toBe(formatTraceparent(span.context))
	expect(calls[0].headers.get('tracestate')).toBe('vendor=1')
})

test('webhook: no traceparent is sent when propagation is disabled', async () => {
	const { tracer, flush } = createRecordingTracer()
	const { calls, fetcher } = createFetcher()
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: false })

	await handle(handler, createTarget())
	await flush()

	expect(calls[0].headers.get('traceparent')).toBeNull()
})

test('webhook: a target-configured traceparent wins in any letter case', async () => {
	const { tracer, flush } = createRecordingTracer()
	const { calls, fetcher } = createFetcher()
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true })
	const userValue = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

	await handle(handler, createTarget({ Traceparent: userValue }))
	await flush()

	expect(calls[0].headers.get('traceparent')).toBe(userValue)
})

test('webhook: the span identifies the target by name only', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const { fetcher } = createFetcher()
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true })

	await handle(handler, createTarget({ Authorization: 'Bearer secret' }))
	await flush()

	const span = webhookSpanOf(exporter.spans)
	expect(span.kind).toBe('client')
	expect(span.status.code).toBe('unset')
	expect(span.attributes).toStrictEqual({
		'contember.actions.target': 'test_target',
		'contember.actions.events': 2,
		'http.response.status_code': 200,
	})
})

test('webhook: a failed fetch is recorded on the span', async () => {
	const { exporter, tracer, flush } = createRecordingTracer()
	const { fetcher } = createFetcher(async () => {
		throw new Error('connection refused')
	})
	const handler = new WebhookTargetHandler(fetcher, tracer, { propagateToWebhooks: true })

	const result = await handle(handler, createTarget())
	await flush()

	expect(result.every(it => !it.result.ok)).toBe(true)
	const span = webhookSpanOf(exporter.spans)
	expect(span.status.code).toBe('error')
	expect(span.status.message).toBe('connection refused')
	expect(span.events.map(it => it.name)).toStrictEqual(['exception'])
	expect(span.attributes['http.response.status_code']).toBeUndefined()
})
