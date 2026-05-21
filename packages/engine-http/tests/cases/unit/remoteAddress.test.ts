import { expect, test } from 'bun:test'
import { IncomingMessage } from 'node:http'
import { getClientIP } from '../../../src/utils/remoteAddress'

const req = (remoteAddress: string | undefined, xff?: string | string[]): IncomingMessage => ({
	socket: { remoteAddress },
	headers: xff === undefined ? {} : { 'x-forwarded-for': xff },
} as unknown as IncomingMessage)

const PUBLIC = '203.0.113.10'
const PUBLIC_2 = '198.51.100.5'

test('direct public client: returns socket ip and ignores X-Forwarded-For (anti-spoof)', () => {
	// Attacker connecting directly cannot fake their IP via XFF.
	expect(getClientIP(req(PUBLIC, '8.8.8.8'))).toBe(PUBLIC)
})

test('loopback IPv6 proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('::1', PUBLIC))).toBe(PUBLIC)
})

test('loopback IPv4 proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('127.0.0.1', PUBLIC))).toBe(PUBLIC)
})

test('loopback in 127.0.0.0/8 (not just 127.0.0.1): honors X-Forwarded-For', () => {
	expect(getClientIP(req('127.5.6.7', PUBLIC))).toBe(PUBLIC)
})

test('ipv4-mapped loopback proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('::ffff:127.0.0.1', PUBLIC))).toBe(PUBLIC)
})

test('ipv4-mapped private proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('::ffff:10.0.0.1', PUBLIC))).toBe(PUBLIC)
})

test('private RFC1918 proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('10.0.0.1', PUBLIC))).toBe(PUBLIC)
})

test('IPv6 unique-local proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('fc00::1', PUBLIC))).toBe(PUBLIC)
})

test('IPv6 link-local proxy: honors X-Forwarded-For', () => {
	expect(getClientIP(req('fe80::1', PUBLIC))).toBe(PUBLIC)
})

test('spoofed public IP on the left of a real client: returns rightmost public (anti-spoof)', () => {
	// Trusted proxy appends the real client IP to the right; the leftmost is attacker-controlled.
	expect(getClientIP(req('::1', `8.8.8.8, ${PUBLIC}`))).toBe(PUBLIC)
})

test('skips trailing private hops and returns rightmost public', () => {
	expect(getClientIP(req('10.0.0.1', `${PUBLIC}, 10.0.0.2, 192.168.0.1`))).toBe(PUBLIC)
})

test('no X-Forwarded-For with loopback socket: falls back to socket ip', () => {
	expect(getClientIP(req('::1'))).toBe('::1')
})

test('X-Forwarded-For with only private entries: falls back to socket remote', () => {
	expect(getClientIP(req('10.0.0.1', '10.0.0.2, 192.168.0.1'))).toBe('10.0.0.1')
})

test('whitespace and empty entries are tolerated', () => {
	expect(getClientIP(req('::1', `  , ${PUBLIC} ,  `))).toBe(PUBLIC)
})

test('array X-Forwarded-For header is flattened', () => {
	expect(getClientIP(req('::1', ['8.8.8.8', PUBLIC]))).toBe(PUBLIC)
})

test('missing socket remote address: returns empty string', () => {
	expect(getClientIP(req(undefined, PUBLIC))).toBe('')
})

test('trustedProxies: public proxy in CIDR is trusted and X-Forwarded-For is honored', () => {
	expect(getClientIP(req('203.0.113.1', PUBLIC_2), ['203.0.113.0/24'])).toBe(PUBLIC_2)
})

test('trustedProxies: entries in the CIDR are skipped while scanning the chain', () => {
	// 8.8.8.8 is the real client; 203.0.113.1 is a trusted proxy hop inside the CIDR.
	expect(getClientIP(req('::1', '8.8.8.8, 203.0.113.1'), ['203.0.113.0/24'])).toBe('8.8.8.8')
})

test('trustedProxies: invalid CIDR entry is ignored, not thrown', () => {
	expect(getClientIP(req('::1', PUBLIC), ['not-a-cidr'])).toBe(PUBLIC)
})
