import { expect, test } from 'bun:test'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { createTracer, ReadableSpan, SpanProcessor } from '@contember/telemetry'
import { VerifyResult } from '@contember/engine-tenant-api'
import { Readable } from 'node:stream'
import { WebSocket } from 'ws'
import { Application, RunningApplication } from '../../../src/application/application.js'
import { Authenticator } from '../../../src/common/Authorizator.js'
import { HttpErrorResponse, HttpResponse } from '../../../src/common/HttpResponse.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { ProjectGroupContainer } from '../../../src/projectGroup/ProjectGroupContainer.js'
import { ProjectGroupResolver } from '../../../src/projectGroup/ProjectGroupResolver.js'
import { createMock } from '../../utils.js'

const incomingTraceId = '4bf92f3577b34da6a3ce929d0e0e4736'
const incomingSpanId = '00f067aa0ba902b7'
const traceparent = `00-${incomingTraceId}-${incomingSpanId}-01`

const unavailable = (): never => {
	throw new Error('This service is not available in the request tracing test')
}

const createTestApplication = () => {
	const spans: ReadableSpan[] = []
	const processor: SpanProcessor = {
		onEnd: span => spans.push(span),
		forceFlush: async () => {},
		shutdown: async () => {},
	}
	const tracer = createTracer({ processor })
	const logger = createLogger(new TestLoggerHandler())
	const authenticator = createMock<Authenticator>({
		authenticate: async ({ timer }) => await timer('Auth', async () => new VerifyResult('identity', 'api-key', ['member'], null)),
	})
	const groupContainer: ProjectGroupContainer = {
		slug: 'group',
		logger,
		authenticator,
		get projectMembershipResolver() {
			return unavailable()
		},
		get projectContainerResolver() {
			return unavailable()
		},
		get projectSchemaResolver() {
			return unavailable()
		},
		get projectInitializer() {
			return unavailable()
		},
		get tenantContainer() {
			return unavailable()
		},
		get tenantGraphQLHandler() {
			return unavailable()
		},
		get systemContainer() {
			return unavailable()
		},
		get systemGraphQLHandler() {
			return unavailable()
		},
	}
	const projectGroupResolver = createMock<ProjectGroupResolver>({
		resolveContainer: async () => groupContainer,
	})
	const config = serverConfigSchema({
		port: 0,
		telemetry: { traces: { acceptIncoming: 'all', traceIdResponseHeader: true } },
	})
	return { application: new Application(projectGroupResolver, config, false, undefined, logger, tracer), spans }
}

const listen = async (application: Application): Promise<{ running: RunningApplication; httpUrl: string; wsUrl: string }> => {
	const running = await application.listen()
	const address = running.server.address()
	if (address === null || typeof address === 'string') {
		await running.close()
		throw new Error('The test server did not bind to a TCP port')
	}
	return {
		running,
		httpUrl: `http://127.0.0.1:${address.port}`,
		wsUrl: `ws://127.0.0.1:${address.port}`,
	}
}

const findSpan = (spans: readonly ReadableSpan[], name: string): ReadableSpan => {
	const span = spans.find(it => it.name === name)
	if (span === undefined) {
		throw new Error(`Span ${name} was not recorded`)
	}
	return span
}

test('records a matched HTTP request with its context and excludes an unmatched route', async () => {
	const { application, spans } = createTestApplication()
	application.addRoute('content', '/content/:projectSlug', ({ timer }) => timer('Controller', () => new HttpResponse(200, 'ok')))
	const { running, httpUrl } = await listen(application)
	try {
		const response = await fetch(`${httpUrl}/content/article`, { headers: { traceparent } })
		expect(await response.text()).toBe('ok')
		const root = findSpan(spans, 'HTTP GET /content/:projectSlug')
		expect(root.kind).toBe('server')
		expect(root.context.traceId).toBe(incomingTraceId)
		expect(root.parentSpanId).toBe(incomingSpanId)
		expect(root.attributes).toMatchObject({
			'http.request.method': 'GET',
			'http.response.status_code': 200,
			'url.path': '/content/article',
			'contember.module': 'content',
			'contember.project_group': 'group',
			'contember.project': 'article',
			'contember.identity_id': 'identity',
		})
		expect(response.headers.get('x-contember-trace-id')).toBe(root.context.traceId)
		expect(findSpan(spans, 'Auth').parentSpanId).toBe(root.context.spanId)
		expect(findSpan(spans, 'Controller').parentSpanId).toBe(root.context.spanId)

		const spanCount = spans.length
		expect((await fetch(`${httpUrl}/missing`)).status).toBe(404)
		expect(spans).toHaveLength(spanCount)
	} finally {
		await running.close()
	}
})

test('marks handled server errors as failed without exporting multiline details', async () => {
	const { application, spans } = createTestApplication()
	application.addRoute('content', '/handled', () => new HttpErrorResponse(503, 'Unavailable'))
	application.addRoute('content', '/thrown', () => {
		throw new Error('Database query error\nSQL: SELECT secret\nparameters: token')
	})
	const { running, httpUrl } = await listen(application)
	try {
		expect((await fetch(`${httpUrl}/handled`)).status).toBe(503)
		expect(findSpan(spans, 'HTTP GET /handled').status.code).toBe('error')

		expect((await fetch(`${httpUrl}/thrown`)).status).toBe(500)
		const thrown = findSpan(spans, 'HTTP GET /thrown')
		expect(thrown.status.code).toBe('error')
		expect(thrown.events[0].attributes?.['exception.message']).toBe('Database query error')
		const exceptionValues = Object.values(thrown.events[0].attributes ?? {}).join('\n')
		expect(exceptionValues).not.toContain('SELECT secret')
		expect(exceptionValues).not.toContain('token')
	} finally {
		await running.close()
	}
})

test('ends the HTTP root span after a streamed response finishes', async () => {
	const { application, spans } = createTestApplication()
	let releaseStream = () => {}
	const streamReleased = new Promise<void>(resolve => {
		releaseStream = resolve
	})
	application.addRoute('transfer', '/stream', context => {
		context.koa.status = 200
		context.koa.body = Readable.from((async function*() {
			yield 'first'
			await streamReleased
			context.tracer.span('StreamWork', () => {})
			yield 'second'
		})())
	})
	const { running, httpUrl } = await listen(application)
	try {
		const response = await fetch(`${httpUrl}/stream`)
		expect(spans.some(it => it.name === 'HTTP GET /stream')).toBe(false)
		releaseStream()
		expect(await response.text()).toBe('firstsecond')
		const root = findSpan(spans, 'HTTP GET /stream')
		expect(findSpan(spans, 'Stream').parentSpanId).toBe(root.context.spanId)
		expect(findSpan(spans, 'StreamWork').parentSpanId).toBe(root.context.spanId)
	} finally {
		releaseStream()
		await running.close()
	}
})

test('parents WebSocket authentication under a server handshake span', async () => {
	const { application, spans } = createTestApplication()
	let cleanupFinished = false
	application.addWebsocketRoute('actions', '/actions/:projectSlug', ({ ws, waitUntil }) => {
		waitUntil(
			new Promise<void>(resolve => {
				ws.once('close', () => {
					setTimeout(() => {
						cleanupFinished = true
						resolve()
					}, 10)
				})
			}),
		)
		setTimeout(() => ws.terminate(), 10)
	})
	const { running, wsUrl } = await listen(application)
	let client: WebSocket | undefined
	try {
		await new Promise<void>((resolve, reject) => {
			client = new WebSocket(`${wsUrl}/actions/article`, { headers: { traceparent } })
			client.once('error', reject)
			client.once('close', () => resolve())
		})
		const root = findSpan(spans, 'WS /actions/:projectSlug')
		expect(root.context.traceId).toBe(incomingTraceId)
		expect(root.parentSpanId).toBe(incomingSpanId)
		expect(root.attributes).toMatchObject({
			'http.response.status_code': 101,
			'contember.module': 'actions',
			'contember.project_group': 'group',
			'contember.project': 'article',
			'contember.identity_id': 'identity',
		})
		expect(findSpan(spans, 'Auth').parentSpanId).toBe(root.context.spanId)
	} finally {
		client?.terminate()
		running.server.closeAllConnections()
		await running.close()
	}
	expect(cleanupFinished).toBe(true)
})
