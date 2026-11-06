import { describe, expect, test } from 'bun:test'
import { createEgressGuard, EgressError, EgressPolicy } from '../../../src/index.js'

const strict = new EgressPolicy({ allowHttp: false, allowlist: [] })

describe('EgressPolicy addresses', () => {
	test.each([
		'0.0.0.0',
		'10.1.2.3',
		'100.64.0.1',
		'127.0.0.1',
		'169.254.169.254',
		'172.16.0.1',
		'192.168.1.1',
		'224.0.0.1',
		'255.255.255.255',
		'::',
		'::1',
		'::ffff:127.0.0.1',
		'::ffff:169.254.169.254',
		'64:ff9b::7f00:1',
		'fc00::1',
		'fd12:3456::1',
		'fe80::1',
		'ff02::1',
		'2001:db8::1',
		'2002:7f00:1::1',
	])('refuses %s', address => {
		expect(() => strict.checkAddress('example.com', address)).toThrow(EgressError)
	})

	test.each(['93.184.215.14', '1.1.1.1', '2606:4700:4700::1111'])('allows public %s', address => {
		expect(() => strict.checkAddress('example.com', address)).not.toThrow()
	})

	test('an allow-listed network or host passes the address check', () => {
		const policy = new EgressPolicy({ allowHttp: false, allowlist: ['10.0.0.0/8', 'internal.example', '::1'] })
		expect(() => policy.checkAddress('hooks.example.com', '10.20.30.40')).not.toThrow()
		expect(() => policy.checkAddress('Internal.Example.', '192.168.0.1')).not.toThrow()
		expect(() => policy.checkAddress('hooks.example.com', '::1')).not.toThrow()
		expect(() => policy.checkAddress('hooks.example.com', '192.168.0.1')).toThrow(EgressError)
	})

	test.each(['10.0.0.0/33', '10.0.0.0/8/1', 'host/8', '', '::1/x'])('rejects the invalid allowlist entry %p', entry => {
		expect(() => new EgressPolicy({ allowHttp: false, allowlist: [entry] })).toThrow(EgressError)
	})
})

describe('EgressPolicy URLs', () => {
	test('only https unless http is allowed', () => {
		expect(() => strict.checkUrl(new URL('https://example.com/hook'))).not.toThrow()
		expect(() => strict.checkUrl(new URL('http://example.com/hook'))).toThrow('Only https:// URLs are allowed')
		expect(() => strict.checkUrl(new URL('ftp://example.com/hook'))).toThrow(EgressError)
		const withHttp = new EgressPolicy({ allowHttp: true, allowlist: [] })
		expect(() => withHttp.checkUrl(new URL('http://example.com/hook'))).not.toThrow()
		expect(() => withHttp.checkUrl(new URL('ftp://example.com/hook'))).toThrow(EgressError)
	})

	test('an IP-literal host is checked without a lookup', () => {
		expect(() => strict.checkUrl(new URL('https://127.0.0.1/'))).toThrow('non-public address')
		expect(() => strict.checkUrl(new URL('https://[::1]/'))).toThrow('non-public address')
		expect(() => strict.checkUrl(new URL('https://[::ffff:a9fe:a9fe]/'))).toThrow('non-public address')
		expect(() => strict.checkUrl(new URL('https://1.1.1.1/'))).not.toThrow()
	})

	test('URLs with credentials are refused', () => {
		expect(() => strict.checkUrl(new URL('https://user:pass@example.com/'))).toThrow(EgressError)
	})
})

describe('createEgressGuard', () => {
	test('the guard is opt-in', () => {
		expect(createEgressGuard(undefined)).toBeNull()
		expect(createEgressGuard({})).toBeNull()
		expect(createEgressGuard({ guard: false, allowHttp: true })).toBeNull()
		expect(createEgressGuard({ guard: true })).not.toBeNull()
	})
})
