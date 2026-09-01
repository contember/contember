import { generateSpanId, generateTraceId, INVALID_SPAN_ID, INVALID_TRACE_ID } from './ids.js'
import { SpanContext } from './types.js'

export const TRACE_FLAG_SAMPLED = 0x01

const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/

export const parseTraceparent = (header: string): SpanContext | undefined => {
	const match = TRACEPARENT_PATTERN.exec(header)
	if (match === null) {
		return undefined
	}
	const [, version, traceId, spanId, flags] = match
	if (version === 'ff' || traceId === INVALID_TRACE_ID || spanId === INVALID_SPAN_ID) {
		return undefined
	}
	return { traceId, spanId, traceFlags: Number.parseInt(flags, 16) }
}

export const formatTraceparent = (context: SpanContext): string =>
	`00-${context.traceId}-${context.spanId}-${(context.traceFlags & 0xff).toString(16).padStart(2, '0')}`

export const createTraceparent = (): string =>
	formatTraceparent({ traceId: generateTraceId(), spanId: generateSpanId(), traceFlags: TRACE_FLAG_SAMPLED })
