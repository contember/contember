import { expect, test } from 'bun:test'
import { performance } from 'node:perf_hooks'
import { alwaysSampler, createTracer, ReadableSpan, SpanProcessor, TestSpanExporter } from '@contember/telemetry'
import { createEventTimer, EventTime } from '../../../src/application/application.js'

const createRecordingTracer = () => {
	const exporter = new TestSpanExporter()
	const processor: SpanProcessor = {
		onEnd: (span: ReadableSpan) => void exporter.export([span]),
		forceFlush: async () => {},
		shutdown: async () => {},
	}
	return { exporter, tracer: createTracer({ sampler: alwaysSampler(), processor }) }
}

test('timer: returns the callback value synchronously and opens a span nested under the active parent', () => {
	const { exporter, tracer } = createRecordingTracer()
	const times: EventTime[] = []
	const timer = createEventTimer(tracer, times, performance.now())

	const result = tracer.span('root', rootSpan => {
		const value = timer('X', () => 42)
		expect(value).toBe(42)
		return rootSpan.context.spanId
	})

	const spanX = exporter.spans.find(it => it.name === 'X')
	expect(spanX).toBeDefined()
	expect(spanX?.parentSpanId).toBe(result)
	expect(times).toHaveLength(1)
	expect(times[0].label).toBe('X')
})

test('timer: an async callback still gets its duration recorded', async () => {
	const { exporter, tracer } = createRecordingTracer()
	const times: EventTime[] = []
	const timer = createEventTimer(tracer, times, performance.now())

	await tracer.span('root', () =>
		timer('Y', async () => {
			await new Promise(resolve => setTimeout(resolve, 5))
			return 'done'
		}))
	await new Promise(resolve => setTimeout(resolve, 5))

	expect(times[0].duration).toBeGreaterThanOrEqual(0)
	expect(exporter.spans.map(it => it.name)).toContain('Y')
})

test('timer: a nested timer produces a nested span', () => {
	const { exporter, tracer } = createRecordingTracer()
	const times: EventTime[] = []
	const timer = createEventTimer(tracer, times, performance.now())

	tracer.span('root', () => timer('outer', () => timer('inner', () => null)))

	const outer = exporter.spans.find(it => it.name === 'outer')
	const inner = exporter.spans.find(it => it.name === 'inner')
	expect(inner?.parentSpanId).toBe(outer?.context.spanId ?? 'missing')
	expect(times.map(it => it.label)).toStrictEqual(['outer', 'inner'])
})

test('timer: a throwing callback propagates and the span is marked failed', () => {
	const { exporter, tracer } = createRecordingTracer()
	const times: EventTime[] = []
	const timer = createEventTimer(tracer, times, performance.now())

	expect(() =>
		tracer.span('root', () =>
			timer('Z', () => {
				throw new Error('boom')
			}))
	).toThrow('boom')

	const spanZ = exporter.spans.find(it => it.name === 'Z')
	expect(spanZ?.status.code).toBe('error')
	expect(times.map(it => it.label)).toStrictEqual(['Z'])
})
