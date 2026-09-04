import { expect, test } from 'bun:test'
import { IncomingTraceRequest, isIncomingTraceTrusted, resolveIncomingSpanContext } from '../../../src/telemetry/incomingTrace.js'

const TRUSTED_PROXIES = ['10.0.0.0/8', '::1/128']
const TRACEPARENT = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'

const request = (remoteAddress: string | undefined, headers: Record<string, string> = {}): IncomingTraceRequest => ({
	headers,
	socket: { remoteAddress },
})

test('trust gate: none never accepts, even from a trusted proxy', () => {
	expect(isIncomingTraceTrusted({ mode: 'none', peerAddress: '10.0.0.1', trustedProxies: TRUSTED_PROXIES })).toBe(false)
})

test('trust gate: all accepts any peer, including an unknown one', () => {
	expect(isIncomingTraceTrusted({ mode: 'all', peerAddress: '203.0.113.10', trustedProxies: [] })).toBe(true)
	expect(isIncomingTraceTrusted({ mode: 'all', peerAddress: undefined, trustedProxies: [] })).toBe(true)
})

test('trust gate: trusted-proxies accepts a peer inside the configured CIDRs', () => {
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: '10.1.2.3', trustedProxies: TRUSTED_PROXIES })).toBe(true)
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: '::1', trustedProxies: TRUSTED_PROXIES })).toBe(true)
})

test('trust gate: trusted-proxies accepts an IPv4-mapped IPv6 peer inside an IPv4 CIDR', () => {
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: '::ffff:10.1.2.3', trustedProxies: TRUSTED_PROXIES })).toBe(true)
})

test('trust gate: trusted-proxies rejects a peer outside the configured CIDRs', () => {
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: '203.0.113.10', trustedProxies: TRUSTED_PROXIES })).toBe(false)
})

test('trust gate: trusted-proxies rejects loopback when it is not listed (no implicit trust)', () => {
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: '127.0.0.1', trustedProxies: ['10.0.0.0/8'] })).toBe(false)
})

test('trust gate: trusted-proxies rejects an unknown peer address', () => {
	expect(isIncomingTraceTrusted({ mode: 'trusted-proxies', peerAddress: undefined, trustedProxies: TRUSTED_PROXIES })).toBe(false)
})

test('incoming context: parsed from a trusted peer', () => {
	const context = resolveIncomingSpanContext(request('10.0.0.1', { traceparent: TRACEPARENT }), {
		mode: 'trusted-proxies',
		trustedProxies: TRUSTED_PROXIES,
	})
	expect(context).toStrictEqual({
		traceId: '0af7651916cd43dd8448eb211c80319c',
		spanId: 'b7ad6b7169203331',
		traceFlags: 1,
	})
})

test('incoming context: tracestate is passed through', () => {
	const context = resolveIncomingSpanContext(request('10.0.0.1', { traceparent: TRACEPARENT, tracestate: 'vendor=value' }), {
		mode: 'trusted-proxies',
		trustedProxies: TRUSTED_PROXIES,
	})
	expect(context?.traceState).toBe('vendor=value')
})

test('incoming context: malformed tracestate is omitted without discarding a valid traceparent', () => {
	const context = resolveIncomingSpanContext(request('10.0.0.1', { traceparent: TRACEPARENT, tracestate: 'Vendor=value' }), {
		mode: 'trusted-proxies',
		trustedProxies: TRUSTED_PROXIES,
	})
	expect(context).toStrictEqual({
		traceId: '0af7651916cd43dd8448eb211c80319c',
		spanId: 'b7ad6b7169203331',
		traceFlags: 1,
	})
})

test('incoming context: overlong tracestate is omitted without discarding a valid traceparent', () => {
	const tracestate = `${'a'.repeat(256)}=${'x'.repeat(256)}`
	const context = resolveIncomingSpanContext(request('10.0.0.1', { traceparent: TRACEPARENT, tracestate }), {
		mode: 'trusted-proxies',
		trustedProxies: TRUSTED_PROXIES,
	})
	expect(context).toStrictEqual({
		traceId: '0af7651916cd43dd8448eb211c80319c',
		spanId: 'b7ad6b7169203331',
		traceFlags: 1,
	})
})

test('incoming context: ignored when the peer is not trusted', () => {
	expect(resolveIncomingSpanContext(request('203.0.113.10', { traceparent: TRACEPARENT }), {
		mode: 'trusted-proxies',
		trustedProxies: TRUSTED_PROXIES,
	})).toBeUndefined()
})

test('incoming context: undefined without a traceparent header', () => {
	expect(resolveIncomingSpanContext(request('10.0.0.1'), { mode: 'all', trustedProxies: [] })).toBeUndefined()
})

test('incoming context: undefined for a malformed traceparent', () => {
	expect(resolveIncomingSpanContext(request('10.0.0.1', { traceparent: 'garbage' }), { mode: 'all', trustedProxies: [] })).toBeUndefined()
})
