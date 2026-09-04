import { generateSpanId, generateTraceId, INVALID_SPAN_ID, INVALID_TRACE_ID } from './ids.js'
import { SpanContext } from './types.js'

export const TRACE_FLAG_SAMPLED = 0x01

const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/
const TRACESTATE_SIMPLE_KEY_PATTERN = /^[a-z][a-z0-9_*/-]{0,255}$/
const TRACESTATE_TENANT_KEY_PATTERN = /^[a-z0-9][a-z0-9_*/-]{0,240}@[a-z][a-z0-9_*/-]{0,13}$/
const TRACESTATE_VALUE_PATTERN = /^[\x20-\x2b\x2d-\x3c\x3e-\x7e]{0,255}[\x21-\x2b\x2d-\x3c\x3e-\x7e]$/

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

export const parseTracestate = (header: string): string | undefined => {
	if (header.length > 512) {
		return undefined
	}
	const members = header.split(',')
	if (members.length > 32) {
		return undefined
	}
	const keys = new Set<string>()
	const normalized: string[] = []
	for (const rawMember of members) {
		const member = rawMember.replace(/^[ \t]*|[ \t]*$/g, '')
		if (member === '') {
			continue
		}
		const separator = member.indexOf('=')
		if (separator <= 0) {
			return undefined
		}
		const key = member.slice(0, separator)
		const value = member.slice(separator + 1)
		if (
			(!TRACESTATE_SIMPLE_KEY_PATTERN.test(key) && !TRACESTATE_TENANT_KEY_PATTERN.test(key))
			|| !TRACESTATE_VALUE_PATTERN.test(value)
			|| keys.has(key)
		) {
			return undefined
		}
		keys.add(key)
		normalized.push(`${key}=${value}`)
	}
	return normalized.join(',')
}

export const formatTraceparent = (context: SpanContext): string =>
	`00-${context.traceId}-${context.spanId}-${(context.traceFlags & 0xff).toString(16).padStart(2, '0')}`

export const createTraceparent = (): string =>
	formatTraceparent({ traceId: generateTraceId(), spanId: generateSpanId(), traceFlags: TRACE_FLAG_SAMPLED })
