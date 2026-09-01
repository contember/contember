import { expect, test } from 'bun:test'
import { Connection, EventManager } from '@contember/database'
import { alwaysSampler, createTracer, ReadableSpan, SpanProcessor, TestSpanExporter, withSpanContext } from '@contember/telemetry'
import { createSqlSpansRegistrar, SqlSpanLabels } from '../../../src/telemetry/sqlSpans.js'

const labels = { module: 'content', project: 'blog', projectGroup: 'main', instance: 'single' } satisfies SqlSpanLabels

const createConnection = (): Connection.Queryable => ({
	eventManager: new EventManager(),
	query: async () => {
		throw new Error('not queried in this test')
	},
})

const createRecordingTracer = () => {
	const exporter = new TestSpanExporter()
	const processor: SpanProcessor = {
		onEnd: (span: ReadableSpan) => void exporter.export([span]),
		forceFlush: async () => {},
		shutdown: async () => {},
	}
	return { exporter, tracer: createTracer({ sampler: alwaysSampler(), processor }) }
}

const query = (sql: string, meta: Record<string, any> = {}): Connection.Query => ({ sql, parameters: [], meta })

const result = (selfDuration: number): Connection.Result => ({
	rowCount: 1,
	rows: [],
	timing: { selfDuration, totalDuration: selfDuration },
})

test('sql spans: a query inside an active span is traced', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	const rootSpanId = tracer.span('root', span => {
		const q = query('select 1')
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryEnd, q, result(12345))
		return span.context.spanId
	})

	const sqlSpan = exporter.spans.find(it => it.name === 'SELECT')
	expect(sqlSpan).toBeDefined()
	expect(sqlSpan?.kind).toBe('client')
	expect(sqlSpan?.parentSpanId).toBe(rootSpanId)
	expect(sqlSpan?.status.code).toBe('unset')
	expect(sqlSpan?.attributes).toStrictEqual({
		'db.system': 'postgresql',
		'contember.module': 'content',
		'contember.project': 'blog',
		'contember.project_group': 'main',
		'contember.db_instance': 'single',
		'db.contember.execution_ms': 12.345,
	})
})

test('sql spans: the operation name comes from the first sql keyword', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	tracer.span('root', () => {
		for (const sql of ['  insert into "x" values (1)', 'UPDATE "x" set a = 1', 'with foo as (select 1) select * from foo', '/* c */ select 1']) {
			const q = query(sql)
			connection.eventManager.fire(EventManager.Event.queryStart, q)
			connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))
		}
	})

	expect(exporter.spans.map(it => it.name)).toStrictEqual(['INSERT', 'UPDATE', 'WITH', 'SQL', 'root'])
})

test('sql spans: query text is included only when configured', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: true })(connection, labels)

	tracer.span('root', () => {
		const q = query('select 1')
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))
	})

	expect(exporter.spans[0].attributes['db.query.text']).toBe('select 1')
})

test('sql spans: the query meta module overrides the registrar label', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	tracer.span('root', () => {
		const q = query('select 1', { module: 'system' })
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))
	})

	expect(exporter.spans[0].attributes['contember.module']).toBe('system')
})

test('sql spans: a failed query is recorded as an error', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	tracer.span('root', () => {
		const q = query('delete from "x"')
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryError, q, new Error('deadlock detected'))
	})

	const sqlSpan = exporter.spans[0]
	expect(sqlSpan.name).toBe('DELETE')
	expect(sqlSpan.status).toStrictEqual({ code: 'error', message: 'deadlock detected' })
	expect(sqlSpan.events.map(it => it.name)).toStrictEqual(['exception'])
	expect(sqlSpan.attributes['db.contember.execution_ms']).toBeUndefined()
})

test('sql spans: nothing is traced without an ambient span', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	const q = query('select 1')
	connection.eventManager.fire(EventManager.Event.queryStart, q)
	connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))

	expect(exporter.spans).toHaveLength(0)
})

test('sql spans: an extracted remote context is enough of an ambient parent', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	const remote = { traceId: '0af7651916cd43dd8448eb211c80319c', spanId: 'b7ad6b7169203331', traceFlags: 1 }
	withSpanContext(remote, () => {
		const q = query('select 1')
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))
	})

	expect(exporter.spans).toHaveLength(1)
	expect(exporter.spans[0].context.traceId).toBe(remote.traceId)
	expect(exporter.spans[0].parentSpanId).toBe(remote.spanId)
})

test('sql spans: interleaved queries are paired by the shared event object', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: true })(connection, labels)

	tracer.span('root', () => {
		const first = query('select 1')
		const second = query('select 2')
		connection.eventManager.fire(EventManager.Event.queryStart, first)
		connection.eventManager.fire(EventManager.Event.queryStart, second)
		connection.eventManager.fire(EventManager.Event.queryEnd, second, result(2000))
		connection.eventManager.fire(EventManager.Event.queryEnd, first, result(1000))
	})

	expect(exporter.spans.slice(0, 2).map(it => [it.attributes['db.query.text'], it.attributes['db.contember.execution_ms']])).toStrictEqual([
		['select 2', 2],
		['select 1', 1],
	])
})

test('sql spans: an end event for an untracked query is ignored', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)

	tracer.span('root', () => {
		connection.eventManager.fire(EventManager.Event.queryEnd, query('select 1'), result(1))
		connection.eventManager.fire(EventManager.Event.queryError, query('select 1'), new Error('nope'))
	})

	expect(exporter.spans.map(it => it.name)).toStrictEqual(['root'])
})

test('sql spans: unregistering removes all listeners', () => {
	const { exporter, tracer } = createRecordingTracer()
	const connection = createConnection()
	const unregister = createSqlSpansRegistrar(tracer, { includeQueryText: false })(connection, labels)
	unregister()

	tracer.span('root', () => {
		const q = query('select 1')
		connection.eventManager.fire(EventManager.Event.queryStart, q)
		connection.eventManager.fire(EventManager.Event.queryEnd, q, result(1))
	})

	expect(exporter.spans.map(it => it.name)).toStrictEqual(['root'])
})
