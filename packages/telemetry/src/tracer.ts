import { AsyncLocalStorage } from 'node:async_hooks'
import { tryGetLogger, withLogger } from '@contember/logger'
import { generateSpanId, generateTraceId, INVALID_SPAN_ID, INVALID_TRACE_ID } from './ids.js'
import { TRACE_FLAG_SAMPLED } from './propagation.js'
import { parentRatioSampler } from './sampler.js'
import { describeExceptionMessage } from './sanitize.js'
import { NonRecordingSpan, SpanImpl } from './span.js'
import { Sampler, Span, SpanContext, SpanOptions, SpanProcessor, Tracer } from './types.js'

interface TraceBudget {
	spanCount: number
	droppedSpanCount: number
}

interface ActiveSpan {
	context: SpanContext
	budget?: TraceBudget
}

const activeSpanStore = new AsyncLocalStorage<ActiveSpan>()

export const withSpanContext = <T>(context: SpanContext, cb: () => T): T => activeSpanStore.run({ context }, cb)

export interface CreateTracerOptions {
	sampler?: Sampler
	processor: SpanProcessor
	maxSpansPerRecordingTrace?: number
}

export const createTracer = (
	{ sampler = parentRatioSampler(1), processor, maxSpansPerRecordingTrace = 1000 }: CreateTracerOptions,
): Tracer => {
	const startedSpans = new WeakMap<Span, ActiveSpan>()

	const create = (name: string, options: SpanOptions | undefined, parent: ActiveSpan | undefined): { span: Span; active: ActiveSpan } => {
		const traceId = parent?.context.traceId ?? generateTraceId()
		const spanId = generateSpanId()
		const traceState = parent?.context.traceState
		if (!sampler.shouldSample({ traceId, name, parent: parent?.context })) {
			const context: SpanContext = { traceId, spanId, traceFlags: 0, traceState }
			return { span: new NonRecordingSpan(context), active: { context } }
		}
		const context: SpanContext = { traceId, spanId, traceFlags: TRACE_FLAG_SAMPLED, traceState }
		const budget = parent?.budget ?? { spanCount: 0, droppedSpanCount: 0 }
		if (budget.spanCount >= maxSpansPerRecordingTrace) {
			budget.droppedSpanCount++
			// the trace stays sampled, only this process stops recording it
			return { span: new NonRecordingSpan(context), active: { context, budget } }
		}
		budget.spanCount++
		const isLocalRoot = parent?.budget === undefined
		const span = new SpanImpl(name, context, parent?.context.spanId, options, readable => {
			if (isLocalRoot && budget.droppedSpanCount > 0) {
				readable.attributes['contember.spans_dropped'] = budget.droppedSpanCount
			}
			processor.onEnd(readable)
		})
		return { span, active: { context, budget } }
	}

	const activate = <T>(active: ActiveSpan, cb: () => T): T => {
		const logger = tryGetLogger()
		const run = logger === undefined
			? cb
			: () => withLogger(logger.child({ traceId: active.context.traceId, spanId: active.context.spanId }), cb)
		return activeSpanStore.run(active, run)
	}

	return {
		span: <T>(name: string, cb: (span: Span) => T, options?: SpanOptions): T => {
			const { span, active } = create(name, options, activeSpanStore.getStore())
			const run = (): T => {
				let result: T
				try {
					result = cb(span)
				} catch (error) {
					failSpan(span, error)
					throw error
				}
				if (isThenable(result)) {
					result.then(() => span.end(), (error: unknown) => failSpan(span, error))
				} else {
					span.end()
				}
				return result
			}
			return activate(active, run)
		},
		startSpan: (name, options) => {
			const parent = options?.parent !== undefined ? { context: options.parent } : activeSpanStore.getStore()
			const created = create(name, options, parent)
			startedSpans.set(created.span, created.active)
			return created.span
		},
		withSpan: (span, cb) => activate(startedSpans.get(span) ?? { context: span.context }, cb),
		activeSpanContext: () => activeSpanStore.getStore()?.context,
	}
}

const noopSpan = new NonRecordingSpan({ traceId: INVALID_TRACE_ID, spanId: INVALID_SPAN_ID, traceFlags: 0 })

export const noopTracer: Tracer = {
	span: <T>(name: string, cb: (span: Span) => T): T => cb(noopSpan),
	startSpan: () => noopSpan,
	withSpan: <T>(span: Span, cb: () => T): T => cb(),
	activeSpanContext: () => undefined,
}

const failSpan = (span: Span, error: unknown): void => {
	span.recordException(error)
	span.setStatus('error', describeExceptionMessage(error))
	span.end()
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => {
	if (typeof value !== 'object' || value === null || !('then' in value)) {
		return false
	}
	return typeof value.then === 'function'
}
