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
