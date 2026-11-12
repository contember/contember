import { describe, expect, test } from 'bun:test'
import { authHeader, envelopeEndpoint, parseDsn } from '../../../src/dsn.js'

describe('parseDsn', () => {
	test('parses a DSN', () => {
		const dsn = parseDsn('https://abc123@o1.ingest.example.com/42')
		expect(dsn).toEqual({ protocol: 'https', publicKey: 'abc123', host: 'o1.ingest.example.com', path: '', projectId: '42' })
		expect(envelopeEndpoint(dsn)).toBe('https://o1.ingest.example.com/api/42/envelope/')
	})

	test('keeps the port and a path prefix', () => {
		const dsn = parseDsn('http://key@127.0.0.1:9000/sentry/relay/7')
		expect(envelopeEndpoint(dsn)).toBe('http://127.0.0.1:9000/sentry/relay/api/7/envelope/')
	})

	test('ignores a secret key', () => {
		expect(parseDsn('https://public:secret@example.com/1').publicKey).toBe('public')
	})

	test.each([
		['not a url', 'not a URL'],
		['ftp://key@example.com/1', 'the protocol must be http or https'],
		['https://example.com/1', 'the public key is missing'],
		['https://key@example.com/', 'the project id must be a number'],
		['https://key@example.com/project', 'the project id must be a number'],
	])('rejects %s', (value, reason) => {
		expect(() => parseDsn(value)).toThrow(`Invalid Sentry DSN: ${reason}`)
	})
})

test('authHeader', () => {
	expect(authHeader(parseDsn('https://abc@example.com/1'), 'contember.sentry-client/1.0.0'))
		.toBe('Sentry sentry_version=7, sentry_key=abc, sentry_client=contember.sentry-client/1.0.0')
})
