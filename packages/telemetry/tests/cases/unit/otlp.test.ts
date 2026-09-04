import { expect, test } from 'bun:test'
import { encodeAttributes, encodeSpan, encodeSpans, ReadableSpan, SpanKind } from '../../../src/index.js'

const linkedContext = { traceId: 'aaaaaaaabbbbbbbbccccccccdddddddd', spanId: '1111111122222222', traceFlags: 1 }

const span: ReadableSpan = {
	name: 'GET /articles',
	context: { traceId: '4bf92f3577b34da6a3ce929d0e0e4736', spanId: '00f067aa0ba902b7', traceFlags: 1 },
	parentSpanId: 'a1b2c3d4e5f60718',
	kind: 'server',
	startTimeUnixNano: 1700000000000000000n,
	endTimeUnixNano: 1700000000123456789n,
	attributes: {
		'http.method': 'GET',
		'http.status_code': 200,
		'http.duration_ms': 12.5,
		'http.cached': false,
		'http.route_parts': ['articles', 'detail'],
		'http.retry_delays': [1, 2.5],
		'http.flags': [true, false],
	},
	events: [{ name: 'exception', timeUnixNano: 1700000000100000000n, attributes: { 'exception.type': 'Error' } }],
	links: [{ context: linkedContext, attributes: { 'link.kind': 'follows' } }],
	status: { code: 'error', message: 'boom' },
}

test('encodes a span into OTLP JSON', () => {
	expect(encodeSpans([span], { serviceName: 'contember', attributes: { 'deployment.environment': 'test' } })).toStrictEqual({
		resourceSpans: [{
			resource: {
				attributes: [
					{ key: 'service.name', value: { stringValue: 'contember' } },
					{ key: 'deployment.environment', value: { stringValue: 'test' } },
				],
			},
			scopeSpans: [{
				scope: { name: '@contember/telemetry' },
				spans: [{
					traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
					spanId: '00f067aa0ba902b7',
					parentSpanId: 'a1b2c3d4e5f60718',
					name: 'GET /articles',
					kind: 2,
					startTimeUnixNano: '1700000000000000000',
					endTimeUnixNano: '1700000000123456789',
					attributes: [
						{ key: 'http.method', value: { stringValue: 'GET' } },
						{ key: 'http.status_code', value: { intValue: '200' } },
						{ key: 'http.duration_ms', value: { doubleValue: 12.5 } },
						{ key: 'http.cached', value: { boolValue: false } },
						{
							key: 'http.route_parts',
							value: { arrayValue: { values: [{ stringValue: 'articles' }, { stringValue: 'detail' }] } },
						},
						{ key: 'http.retry_delays', value: { arrayValue: { values: [{ intValue: '1' }, { doubleValue: 2.5 }] } } },
						{ key: 'http.flags', value: { arrayValue: { values: [{ boolValue: true }, { boolValue: false }] } } },
					],
					events: [{
						name: 'exception',
						timeUnixNano: '1700000000100000000',
						attributes: [{ key: 'exception.type', value: { stringValue: 'Error' } }],
					}],
					links: [{
						traceId: 'aaaaaaaabbbbbbbbccccccccdddddddd',
						spanId: '1111111122222222',
						attributes: [{ key: 'link.kind', value: { stringValue: 'follows' } }],
					}],
					status: { code: 2, message: 'boom' },
				}],
			}],
		}],
	})
})

test('survives a JSON roundtrip unchanged', () => {
	const payload = encodeSpans([span], { serviceName: 'contember' })
	expect(JSON.parse(JSON.stringify(payload))).toStrictEqual(payload)
})

test('omits the status when it is unset', () => {
	expect(encodeSpan({ ...span, status: { code: 'unset' } }).status).toBeUndefined()
	expect(encodeSpan({ ...span, status: { code: 'ok' } }).status).toStrictEqual({ code: 1 })
})

test('omits an absent parent span id and trace state', () => {
	const encoded = encodeSpan({ ...span, parentSpanId: undefined })
	expect('parentSpanId' in encoded).toBe(false)
	expect('traceState' in encoded).toBe(false)
})

test('passes the trace state through', () => {
	const encoded = encodeSpan({ ...span, context: { ...span.context, traceState: 'vendor=1' } })
	expect(encoded.traceState).toBe('vendor=1')
})

test('maps every span kind to its OTLP number', () => {
	const kinds: [SpanKind, number][] = [['internal', 1], ['server', 2], ['client', 3], ['producer', 4], ['consumer', 5]]
	for (const [kind, code] of kinds) {
		expect(encodeSpan({ ...span, kind }).kind).toBe(code)
	}
})

test('sanitizes string data at the OTLP encoding boundary', () => {
	const oversized = 'x'.repeat(5000)
	expect(encodeAttributes({ value: oversized, values: [oversized] })).toEqual([
		{ key: 'value', value: { stringValue: 'x'.repeat(4096) } },
		{ key: 'values', value: { arrayValue: { values: [{ stringValue: 'x'.repeat(4096) }] } } },
	])
	const encoded = encodeSpan({
		...span,
		events: [{
			name: 'exception',
			timeUnixNano: 1n,
			attributes: {
				'exception.message': 'query failed\nSELECT * FROM secrets',
				'exception.stacktrace': 'Error: query failed\nSELECT * FROM secrets\nparameters: [password]\n    at execute (/srv/database.ts:12:3)',
			},
		}],
		status: { code: 'error', message: oversized },
	})
	expect(encoded.events[0].attributes).toEqual([
		{ key: 'exception.message', value: { stringValue: 'query failed' } },
		{ key: 'exception.stacktrace', value: { stringValue: 'Error: query failed\n    at execute (/srv/database.ts:12:3)' } },
	])
	expect(encoded.status).toEqual({ code: 2, message: 'x'.repeat(4096) })
})
