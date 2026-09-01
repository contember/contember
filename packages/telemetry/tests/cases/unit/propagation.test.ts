import { expect, test } from 'bun:test'
import { createTraceparent, formatTraceparent, parseTraceparent, TRACE_FLAG_SAMPLED } from '../../../src/index.js'

const traceId = '4bf92f3577b34da6a3ce929d0e0e4736'
const spanId = '00f067aa0ba902b7'

test('formats a span context as a traceparent', () => {
	expect(formatTraceparent({ traceId, spanId, traceFlags: TRACE_FLAG_SAMPLED })).toBe(`00-${traceId}-${spanId}-01`)
	expect(formatTraceparent({ traceId, spanId, traceFlags: 0 })).toBe(`00-${traceId}-${spanId}-00`)
})

test('parses a traceparent', () => {
	expect(parseTraceparent(`00-${traceId}-${spanId}-01`)).toEqual({ traceId, spanId, traceFlags: 1 })
})

test('accepts an unknown version', () => {
	expect(parseTraceparent(`01-${traceId}-${spanId}-01`)).toEqual({ traceId, spanId, traceFlags: 1 })
})

test('roundtrips a freshly created traceparent', () => {
	const header = createTraceparent()
	const context = parseTraceparent(header)
	expect(context).toBeDefined()
	expect(context?.traceFlags).toBe(TRACE_FLAG_SAMPLED)
	expect(formatTraceparent({ traceId: context?.traceId ?? '', spanId: context?.spanId ?? '', traceFlags: context?.traceFlags ?? 0 })).toBe(header)
})

const invalidHeaders: [string, string][] = [
	['forbidden version', `ff-${traceId}-${spanId}-01`],
	['uppercase trace id', `00-${traceId.toUpperCase()}-${spanId}-01`],
	['uppercase flags', `00-${traceId}-${spanId}-0A`],
	['all-zero trace id', `00-${'0'.repeat(32)}-${spanId}-01`],
	['all-zero span id', `00-${traceId}-${'0'.repeat(16)}-01`],
	['short trace id', `00-${traceId.slice(0, 30)}-${spanId}-01`],
	['long span id', `00-${traceId}-${spanId}ff-01`],
	['missing flags', `00-${traceId}-${spanId}`],
	['trailing content', `00-${traceId}-${spanId}-01-extra`],
	['leading whitespace', ` 00-${traceId}-${spanId}-01`],
	['empty header', ''],
]

for (const [label, header] of invalidHeaders) {
	test(`rejects a traceparent with ${label}`, () => {
		expect(parseTraceparent(header)).toBeUndefined()
	})
}
