import { expect, test } from 'bun:test'
import { createTraceparent, formatTraceparent, parseTraceparent, parseTracestate, TRACE_FLAG_SAMPLED } from '../../../src/index.js'

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

test('parses simple and multi-tenant tracestate keys', () => {
	const header = 'vendor=value, tenant@system=hello world,zero=0'
	expect(parseTracestate(header)).toBe('vendor=value,tenant@system=hello world,zero=0')
	expect(parseTracestate(`${'a'.repeat(256)}=value`)).toBe(`${'a'.repeat(256)}=value`)
	expect(parseTracestate(`${'0'.repeat(241)}@${'a'.repeat(14)}=value`)).toBe(`${'0'.repeat(241)}@${'a'.repeat(14)}=value`)
})

test('accepts practical tracestate limits', () => {
	const members = Array.from({ length: 32 }, (_, index) => `v${index}=value`)
	const maxLengthHeader = `${'a'.repeat(256)}=${'x'.repeat(255)}`
	expect(parseTracestate(members.join(','))).toBe(members.join(','))
	expect(parseTracestate(`a=${'x'.repeat(256)}`)).toBe(`a=${'x'.repeat(256)}`)
	expect(parseTracestate(maxLengthHeader)).toBe(maxLengthHeader)
})

test('accepts and removes empty members and surrounding whitespace', () => {
	expect(parseTracestate('')).toBe('')
	expect(parseTracestate(' \t ')).toBe('')
	expect(parseTracestate(' vendor=one, ,other=two,')).toBe('vendor=one,other=two')
	expect(parseTracestate('vendor=value ')).toBe('vendor=value')
})

const invalidTracestates: [string, string][] = [
	['more than 512 characters', `${'a'.repeat(256)}=${'x'.repeat(256)}`],
	['more than 32 members', Array.from({ length: 33 }, (_, index) => `v${index}=x`).join(',')],
	['an uppercase key', 'Vendor=value'],
	['a digit-prefixed simple key', '1vendor=value'],
	['an oversized simple key', `${'a'.repeat(257)}=value`],
	['an oversized tenant id', `${'0'.repeat(242)}@system=value`],
	['an oversized system id', `tenant@${'a'.repeat(15)}=value`],
	['an invalid tenant system key', 'tenant@1system=value'],
	['an empty value', 'vendor='],
	['an oversized value', `vendor=${'x'.repeat(257)}`],
	['an equals sign in the value', 'vendor=a=b'],
	['whitespace before the equals sign', 'vendor =value'],
	['a non-ASCII value', 'vendor=válue'],
	['duplicate keys', 'vendor=one,vendor=two'],
]

for (const [label, header] of invalidTracestates) {
	test(`rejects a tracestate with ${label}`, () => {
		expect(parseTracestate(header)).toBeUndefined()
	})
}
