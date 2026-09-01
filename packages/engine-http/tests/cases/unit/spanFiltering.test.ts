import { expect, test } from 'bun:test'
import { Attributes, ReadableSpan, SpanKind, SpanProcessor, SpanStatusCode } from '@contember/telemetry'
import { createFastSqlSpanFilter, createFilteringSpanProcessor } from '../../../src/telemetry/FilteringSpanProcessor.js'

const span = (
	{ kind = 'client', attributes = { 'db.system': 'postgresql' }, durationMs = 1, status = 'unset' }: {
		kind?: SpanKind
		attributes?: Attributes
		durationMs?: number
		status?: SpanStatusCode
	},
): ReadableSpan => ({
	name: 'SELECT',
	context: { traceId: '0'.repeat(31) + '1', spanId: '0'.repeat(15) + '1', traceFlags: 1 },
	kind,
	startTimeUnixNano: 0n,
	endTimeUnixNano: BigInt(Math.round(durationMs * 1e6)),
	attributes,
	events: [],
	links: [],
	status: { code: status },
})

const collect = () => {
	const spans: ReadableSpan[] = []
	const inner: SpanProcessor = { onEnd: it => spans.push(it), forceFlush: async () => {}, shutdown: async () => {} }
	return { spans, inner }
}

test('min duration filter: a fast sql span is dropped', () => {
	const { spans, inner } = collect()
	const processor = createFilteringSpanProcessor({ inner, shouldDrop: createFastSqlSpanFilter(10) })
	processor.onEnd(span({ durationMs: 2 }))
	expect(spans).toHaveLength(0)
})

test('min duration filter: a slow sql span is kept', () => {
	const { spans, inner } = collect()
	const processor = createFilteringSpanProcessor({ inner, shouldDrop: createFastSqlSpanFilter(10) })
	processor.onEnd(span({ durationMs: 25 }))
	expect(spans).toHaveLength(1)
})

test('min duration filter: a fast but failed sql span is kept', () => {
	const { spans, inner } = collect()
	const processor = createFilteringSpanProcessor({ inner, shouldDrop: createFastSqlSpanFilter(10) })
	processor.onEnd(span({ durationMs: 1, status: 'error' }))
	expect(spans).toHaveLength(1)
})

test('min duration filter: a fast non-sql span is kept', () => {
	const { spans, inner } = collect()
	const processor = createFilteringSpanProcessor({ inner, shouldDrop: createFastSqlSpanFilter(10) })
	processor.onEnd(span({ durationMs: 1, kind: 'server', attributes: {} }))
	processor.onEnd(span({ durationMs: 1, attributes: {} }))
	expect(spans).toHaveLength(2)
})

test('filtering processor: flush and shutdown delegate to the inner processor', async () => {
	let flushed = 0
	let shutdown = 0
	const inner: SpanProcessor = {
		onEnd: () => {},
		forceFlush: async () => void flushed++,
		shutdown: async () => void shutdown++,
	}
	const processor = createFilteringSpanProcessor({ inner, shouldDrop: () => true })
	await processor.forceFlush()
	await processor.shutdown()
	expect([flushed, shutdown]).toStrictEqual([1, 1])
})
