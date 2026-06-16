import { expect, test } from 'bun:test'
import { serverConfigSchema } from '../../../src/config/configSchema.js'

const trustedProxies = (val: unknown): unknown => serverConfigSchema({ http: { trustedProxies: val } }).http?.trustedProxies

test('trustedProxies: undefined when absent', () => {
	expect(serverConfigSchema({}).http?.trustedProxies).toBeUndefined()
})

test('trustedProxies: empty string yields undefined', () => {
	expect(trustedProxies('')).toBeUndefined()
})

test('trustedProxies: single CIDR', () => {
	expect(trustedProxies('10.0.0.0/8')).toStrictEqual(['10.0.0.0/8'])
})

test('trustedProxies: comma-separated list is split and trimmed', () => {
	expect(trustedProxies('10.0.0.0/8, 192.168.0.0/16 ,  172.16.0.0/12')).toStrictEqual([
		'10.0.0.0/8',
		'192.168.0.0/16',
		'172.16.0.0/12',
	])
})

test('trustedProxies: array input is accepted', () => {
	expect(trustedProxies(['10.0.0.0/8', '::1/128'])).toStrictEqual(['10.0.0.0/8', '::1/128'])
})

test('trustedProxies: bare IPv4 is normalized to /32', () => {
	expect(trustedProxies('203.0.113.1')).toStrictEqual(['203.0.113.1/32'])
})

test('trustedProxies: bare IPv6 is normalized to /128', () => {
	expect(trustedProxies('::1')).toStrictEqual(['::1/128'])
})

test('trustedProxies: mixed bare and CIDR entries', () => {
	expect(trustedProxies('203.0.113.1, 10.0.0.0/8')).toStrictEqual(['203.0.113.1/32', '10.0.0.0/8'])
})

test('trustedProxies: invalid CIDR throws (fail-fast on misconfiguration)', () => {
	expect(() => trustedProxies('not-an-ip')).toThrow()
})

test('trustedProxies: invalid prefixed entry throws', () => {
	expect(() => trustedProxies('10.0.0.0/999')).toThrow()
})

// A03: the trusted reverse-proxy geo-country header name. Same bar as trustedProxies
// since it gates a trust-boundary signal: undefined when unset, string passthrough,
// fail-fast on a non-string value.
const geoCountryHeader = (val: unknown): unknown => serverConfigSchema({ http: { geoCountryHeader: val } }).http?.geoCountryHeader

test('geoCountryHeader: undefined when absent (feature off by default)', () => {
	expect(serverConfigSchema({}).http?.geoCountryHeader).toBeUndefined()
})

test('geoCountryHeader: empty string yields undefined', () => {
	expect(geoCountryHeader('')).toBeUndefined()
})

test('geoCountryHeader: a string passes through unchanged', () => {
	expect(geoCountryHeader('X-Contember-Client-Geo-Country')).toBe('X-Contember-Client-Geo-Country')
})

test('geoCountryHeader: a non-string value throws (fail-fast on misconfiguration)', () => {
	expect(() => geoCountryHeader(123)).toThrow()
	expect(() => geoCountryHeader({})).toThrow()
})
