import { expect, test } from 'bun:test'
import { redactRequestError } from '../../../src/dispatch/redactRequestError'

test('keeps a message without a URL or a secret', () => {
	expect(redactRequestError('getaddrinfo ENOTFOUND example.com', [])).toBe('getaddrinfo ENOTFOUND example.com')
})

test('keeps only the scheme, host and port of a URL', () => {
	expect(redactRequestError('Failed to parse URL from https://user:pw@example.com:8443/a/b?c=d#e', []))
		.toBe('Failed to parse URL from https://[redacted]@example.com:8443/[redacted]')
	expect(redactRequestError('Invalid URL http://example.com/?token=abc.', [])).toBe('Invalid URL http://example.com/[redacted]')
	expect(redactRequestError('Unable to connect to http://example.com/ or http://example.org', []))
		.toBe('Unable to connect to http://example.com/ or http://example.org')
})

test('redacts every URL, a quoted one included', () => {
	expect(redactRequestError('Redirect from "https://a.example/x?t=1" to https://b.example/y', []))
		.toBe('Redirect from "https://a.example/[redacted]" to https://b.example/[redacted]')
})

test('redacts every occurrence of a secret, the longest first', () => {
	expect(redactRequestError('expected abc, got abcdef and abc', ['abc', 'abcdef', ''])).toBe('expected [redacted], got [redacted] and [redacted]')
	expect(redactRequestError('invalid header value "Bearer abc"', ['Bearer abc', 'abc'])).toBe('invalid header value "[redacted]"')
})

test('redacts a password containing @, / or ?', () => {
	expect(redactRequestError('Request cannot be constructed from a URL that includes credentials: https://user:p@ss@example.com/hooks', []))
		.toBe('Request cannot be constructed from a URL that includes credentials: https://[redacted]@example.com/[redacted]')
	// such a password ends the authority early, so only the known value redacts all of it
	expect(redactRequestError('Failed to parse URL from https://user:pa/s?s@example.com/hooks', ['pa/s?s']))
		.toBe('Failed to parse URL from https://[redacted]@example.com/[redacted]')
})

test('redacts a secret quoted without its surrounding whitespace', () => {
	expect(redactRequestError('Headers.append: "Bearer abc\ndef" is an invalid header value.', [' Bearer abc\ndef\n', 'abc\ndef\n']))
		.toBe('Headers.append: "[redacted]" is an invalid header value.')
})

test('scans a long message without a URL in linear time', () => {
	const start = performance.now()
	expect(redactRequestError('a-'.repeat(100_000), [])).toHaveLength(200_000)
	expect(redactRequestError('a.'.repeat(100_000), [])).toHaveLength(200_000)
	// the quadratic scan took seconds on a tenth of this
	expect(performance.now() - start).toBeLessThan(1_000)
})
