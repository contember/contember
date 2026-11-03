import { expect, test } from 'bun:test'
import { redactRequestError } from '../../../src/dispatch/redactRequestError.js'

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
