import { expect, test } from 'bun:test'
import { createBatchSpanProcessor, ReadableSpan, SpanExporter, TestSpanExporter } from '../../../src/index.js'

const createSpan = (name: string): ReadableSpan => ({
	name,
	context: { traceId: '4bf92f3577b34da6a3ce929d0e0e4736', spanId: '00f067aa0ba902b7', traceFlags: 1 },
	kind: 'internal',
	startTimeUnixNano: 1n,
	endTimeUnixNano: 2n,
	attributes: {},
	events: [],
	links: [],
	status: { code: 'unset' },
})

const failingExporter = (message: string): SpanExporter => ({
	export: async () => {
		throw new Error(message)
	},
	shutdown: async () => {},
})

test('exports in batches of at most maxBatchSize', async () => {
	const batches: string[][] = []
	const exporter: SpanExporter = {
		export: async spans => {
			batches.push(spans.map(it => it.name))
		},
		shutdown: async () => {},
	}
	const processor = createBatchSpanProcessor({ exporter, maxBatchSize: 2, delayMs: 60_000 })
	for (const name of ['a', 'b', 'c']) {
		processor.onEnd(createSpan(name))
	}
	await processor.forceFlush()
	expect(batches).toEqual([['a', 'b'], ['c']])
})

test('forceFlush drains a queue below the batch size', async () => {
	const exporter = new TestSpanExporter()
	const processor = createBatchSpanProcessor({ exporter, maxBatchSize: 10, delayMs: 60_000 })
	processor.onEnd(createSpan('a'))
	expect(exporter.spans).toHaveLength(0)
	await processor.forceFlush()
	expect(exporter.spans.map(it => it.name)).toEqual(['a'])
})

test('drops the oldest spans when the queue is full', async () => {
	const errors: unknown[] = []
	const exporter = new TestSpanExporter()
	const processor = createBatchSpanProcessor({
		exporter,
		maxQueueSize: 2,
		maxBatchSize: 10,
		delayMs: 60_000,
		onError: error => errors.push(error),
	})
	for (const name of ['a', 'b', 'c', 'd']) {
		processor.onEnd(createSpan(name))
	}
	await processor.forceFlush()
	expect(exporter.spans.map(it => it.name)).toEqual(['c', 'd'])
	expect(errors).toHaveLength(1)
})

test('a failed export drops the batch without throwing', async () => {
	const errors: unknown[] = []
	const processor = createBatchSpanProcessor({
		exporter: failingExporter('offline'),
		delayMs: 60_000,
		onError: error => errors.push(error),
	})
	processor.onEnd(createSpan('a'))
	await processor.forceFlush()
	expect(errors.map(it => it instanceof Error ? it.message : String(it))).toEqual(['offline'])
	await processor.forceFlush()
})

test('reports export errors at most once per interval', async () => {
	const errors: unknown[] = []
	const processor = createBatchSpanProcessor({
		exporter: failingExporter('offline'),
		delayMs: 60_000,
		onError: error => errors.push(error),
	})
	processor.onEnd(createSpan('a'))
	await processor.forceFlush()
	processor.onEnd(createSpan('b'))
	await processor.forceFlush()
	expect(errors).toHaveLength(1)
})

test('shutdown flushes the queue and closes the exporter', async () => {
	const exporter = new TestSpanExporter()
	let closed = false
	const processor = createBatchSpanProcessor({
		exporter: {
			export: spans => exporter.export(spans),
			shutdown: async () => {
				closed = true
			},
		},
		delayMs: 60_000,
	})
	processor.onEnd(createSpan('a'))
	await processor.shutdown()
	expect(exporter.spans.map(it => it.name)).toEqual(['a'])
	expect(closed).toBe(true)
	processor.onEnd(createSpan('b'))
	await processor.shutdown()
	expect(exporter.spans.map(it => it.name)).toEqual(['a'])
})

test('flushes periodically on the delay timer', async () => {
	const exporter = new TestSpanExporter()
	const processor = createBatchSpanProcessor({ exporter, delayMs: 1 })
	processor.onEnd(createSpan('a'))
	await new Promise(resolve => setTimeout(resolve, 20))
	expect(exporter.spans.map(it => it.name)).toEqual(['a'])
	await processor.shutdown()
})
