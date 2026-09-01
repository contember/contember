import { expect, test } from 'bun:test'
import { createLogger, logger as currentLogger, TestLoggerHandler } from '@contember/logger'
import {
	createTracer,
	CreateTracerOptions,
	neverSampler,
	noopTracer,
	parseTraceparent,
	ReadableSpan,
	SpanProcessor,
	withSpanContext,
} from '../../../src/index.js'

const remoteTraceId = '4bf92f3577b34da6a3ce929d0e0e4736'
const remoteSpanId = '00f067aa0ba902b7'

const createTestTracer = (options: Omit<CreateTracerOptions, 'processor'> = {}) => {
	const spans: ReadableSpan[] = []
	const processor: SpanProcessor = {
		onEnd: span => {
			spans.push(span)
		},
		forceFlush: async () => {},
		shutdown: async () => {},
	}
	return { spans, tracer: createTracer({ ...options, processor }) }
}

const remoteParent = (flags: string) => {
	const context = parseTraceparent(`00-${remoteTraceId}-${remoteSpanId}-${flags}`)
	if (context === undefined) {
		throw new Error('invalid fixture')
	}
	return context
}

test('nests spans under the active one', () => {
	const { tracer, spans } = createTestTracer()
	tracer.span('root', () => {
		tracer.span('child', () => {})
	})
	expect(spans.map(it => it.name)).toEqual(['child', 'root'])
	const [child, root] = spans
	expect(root.parentSpanId).toBeUndefined()
	expect(child.parentSpanId).toBe(root.context.spanId)
	expect(child.context.traceId).toBe(root.context.traceId)
	expect(child.context.spanId).not.toBe(root.context.spanId)
})

test('keeps the active span across await boundaries', async () => {
	const { tracer, spans } = createTestTracer()
	await tracer.span('root', async () => {
		const rootContext = tracer.activeSpanContext()
		await new Promise(resolve => setTimeout(resolve, 1))
		expect(tracer.activeSpanContext()).toEqual(rootContext)
		await tracer.span('child', async () => {
			await new Promise(resolve => setTimeout(resolve, 1))
			expect(tracer.activeSpanContext()?.spanId).not.toBe(rootContext?.spanId)
		})
		expect(tracer.activeSpanContext()).toEqual(rootContext)
	})
	expect(tracer.activeSpanContext()).toBeUndefined()
	const [child, root] = spans
	expect(child.parentSpanId).toBe(root.context.spanId)
})

test('returns a synchronous value and ends the span before returning', () => {
	const { tracer, spans } = createTestTracer()
	const result = tracer.span('sync', () => {
		expect(spans).toHaveLength(0)
		return 42
	})
	expect(result).toBe(42)
	expect(spans).toHaveLength(1)
})

test('ends the span only once the returned promise settles', async () => {
	const { tracer, spans } = createTestTracer()
	const promise = tracer.span('async', async () => {
		await new Promise(resolve => setTimeout(resolve, 1))
		return 'done'
	})
	expect(spans).toHaveLength(0)
	expect(await promise).toBe('done')
	expect(spans.map(it => it.status.code)).toEqual(['unset'])
})

test('records a rejected promise as an error and rethrows it', async () => {
	const { tracer, spans } = createTestTracer()
	const promise = tracer.span('async', async () => {
		throw new Error('nope')
	})
	await expect(promise).rejects.toThrow('nope')
	expect(spans).toHaveLength(1)
	expect(spans[0].status).toEqual({ code: 'error', message: 'nope' })
	expect(spans[0].events.map(it => it.name)).toEqual(['exception'])
	expect(spans[0].events[0].attributes?.['exception.message']).toBe('nope')
})

test('records a synchronous throw as an error and rethrows it', () => {
	const { tracer, spans } = createTestTracer()
	expect(() =>
		tracer.span('sync', () => {
			throw new Error('boom')
		})
	).toThrow('boom')
	expect(spans[0].status).toEqual({ code: 'error', message: 'boom' })
	expect(spans[0].events.map(it => it.name)).toEqual(['exception'])
})

test('records attributes, events, links and status', () => {
	const { tracer, spans } = createTestTracer()
	const link = remoteParent('01')
	tracer.span('recorded', span => {
		span.setAttribute('a', 1).setAttributes({ b: 'two', c: true })
		span.addEvent('event', { d: 1 })
		span.addLink(link, { e: 'f' })
		span.setStatus('ok')
	}, { kind: 'server', attributes: { preset: true } })
	expect(spans[0].kind).toBe('server')
	expect(spans[0].attributes).toEqual({ preset: true, a: 1, b: 'two', c: true })
	expect(spans[0].events.map(it => it.name)).toEqual(['event'])
	expect(spans[0].links).toEqual([{ context: link, attributes: { e: 'f' } }])
	expect(spans[0].status.code).toBe('ok')
})

test('unsampled spans are non-recording but keep a propagatable context', () => {
	const { tracer, spans } = createTestTracer({ sampler: neverSampler() })
	tracer.span('root', span => {
		expect(span.isRecording).toBe(false)
		expect(span.context.traceId).toHaveLength(32)
		expect(span.context.spanId).toHaveLength(16)
		expect(span.context.traceFlags).toBe(0)
		expect(tracer.activeSpanContext()).toEqual(span.context)
		span.setAttribute('ignored', true)
	})
	expect(spans).toHaveLength(0)
})

test('continues an extracted remote parent', () => {
	const { tracer, spans } = createTestTracer()
	withSpanContext(remoteParent('01'), () => {
		tracer.span('child', () => {})
	})
	expect(spans[0].context.traceId).toBe(remoteTraceId)
	expect(spans[0].parentSpanId).toBe(remoteSpanId)
})

test('follows an unsampled remote parent', () => {
	const { tracer, spans } = createTestTracer()
	withSpanContext(remoteParent('00'), () => {
		tracer.span('child', span => {
			expect(span.isRecording).toBe(false)
			expect(span.context.traceId).toBe(remoteTraceId)
		})
	})
	expect(spans).toHaveLength(0)
})

test('startSpan does not touch the active context', () => {
	const { tracer, spans } = createTestTracer()
	const span = tracer.startSpan('manual')
	expect(tracer.activeSpanContext()).toBeUndefined()
	span.end()
	span.end()
	expect(spans.map(it => it.name)).toEqual(['manual'])
	expect(spans[0].parentSpanId).toBeUndefined()
})

test('startSpan accepts an explicit parent', () => {
	const { tracer, spans } = createTestTracer()
	const parent = remoteParent('01')
	tracer.startSpan('manual', { parent }).end()
	expect(spans[0].context.traceId).toBe(remoteTraceId)
	expect(spans[0].parentSpanId).toBe(remoteSpanId)
})

test('startSpan uses the active span as parent', () => {
	const { tracer, spans } = createTestTracer()
	tracer.span('root', () => {
		tracer.startSpan('manual').end()
	})
	const [manual, root] = spans
	expect(manual.parentSpanId).toBe(root.context.spanId)
})

test('caps the number of recording spans per trace', () => {
	const { tracer, spans } = createTestTracer({ maxSpansPerRecordingTrace: 3 })
	tracer.span('root', () => {
		for (let i = 0; i < 5; i++) {
			tracer.span(`child-${i}`, span => {
				expect(span.isRecording).toBe(i < 2)
			})
		}
	})
	expect(spans.map(it => it.name)).toEqual(['child-0', 'child-1', 'root'])
	expect(spans[2].attributes['contember.spans_dropped']).toBe(3)
})

test('does not report dropped spans when the cap is not reached', () => {
	const { tracer, spans } = createTestTracer({ maxSpansPerRecordingTrace: 3 })
	tracer.span('root', () => {
		tracer.span('child', () => {})
	})
	expect(spans[1].attributes['contember.spans_dropped']).toBeUndefined()
})

test('log entries written inside a span carry the trace ids', async () => {
	const handler = new TestLoggerHandler()
	const { tracer, spans } = createTestTracer()
	await createLogger(handler).scope(async () => {
		currentLogger.info('outside')
		tracer.span('root', () => {
			currentLogger.info('inside')
		})
	})
	const [outside, inside] = handler.messages
	expect(outside.message).toBe('outside')
	expect(outside.loggerAttributes.traceId).toBeUndefined()
	expect(inside.message).toBe('inside')
	expect(inside.loggerAttributes.traceId).toBe(spans[0].context.traceId)
	expect(inside.loggerAttributes.spanId).toBe(spans[0].context.spanId)
})

test('works without an active logger', () => {
	const { tracer, spans } = createTestTracer()
	tracer.span('root', () => {})
	expect(spans).toHaveLength(1)
})

test('noop tracer runs the callback and records nothing', () => {
	expect(noopTracer.span('root', span => {
		expect(span.isRecording).toBe(false)
		span.setAttribute('a', 1).addEvent('e').setStatus('ok')
		return 'value'
	})).toBe('value')
	expect(noopTracer.activeSpanContext()).toBeUndefined()
	expect(noopTracer.startSpan('manual').isRecording).toBe(false)
})
