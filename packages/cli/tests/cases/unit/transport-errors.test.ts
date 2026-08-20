import { describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { inspect } from 'node:util'
import { classifyHttpStatus, toHttpTransportError, toTransportError } from '../../../src/lib/errors/TransportError.js'

const context = {
	service: 'Test API',
	codePrefix: 'TEST_API',
	url: 'https://user:password@example.com/path?token=secret#fragment',
}

describe('classifyHttpStatus', () => {
	const cases = [
		{ status: 400, kind: 'input', codeSuffix: 'BAD_REQUEST', exitCode: ExitCode.InputError },
		{ status: 401, kind: 'forbidden', codeSuffix: 'UNAUTHORIZED', exitCode: ExitCode.Forbidden },
		{ status: 403, kind: 'forbidden', codeSuffix: 'FORBIDDEN', exitCode: ExitCode.Forbidden },
		{ status: 404, kind: 'not-found', codeSuffix: 'NOT_FOUND', exitCode: ExitCode.NotFound },
		{ status: 408, kind: 'transient', codeSuffix: 'TIMEOUT', exitCode: ExitCode.Transient },
		{ status: 409, kind: 'conflict', codeSuffix: 'CONFLICT', exitCode: ExitCode.Conflict },
		{ status: 425, kind: 'transient', codeSuffix: 'TOO_EARLY', exitCode: ExitCode.Transient },
		{ status: 429, kind: 'transient', codeSuffix: 'RATE_LIMITED', exitCode: ExitCode.Transient },
		{ status: 500, kind: 'transient', codeSuffix: 'SERVER_ERROR', exitCode: ExitCode.Transient },
	]

	for (const expected of cases) {
		test(`classifies ${expected.status}`, () => {
			expect(classifyHttpStatus(expected.status)).toEqual({
				kind: expected.kind,
				codeSuffix: expected.codeSuffix,
				exitCode: expected.exitCode,
			})
		})
	}
})

describe('transport errors', () => {
	test('creates a safe HTTP error and preserves Retry-After', () => {
		const error = toHttpTransportError({ status: 429, retryAfter: '30' }, context)

		expect(error.code).toBe('TEST_API_RATE_LIMITED')
		expect(error.retryable).toBe(true)
		expect(error.details).toEqual({ status: 429, retryAfter: '30', url: 'https://example.com/path' })
		expect(JSON.stringify(error.details)).not.toContain('password')
		expect(JSON.stringify(error.details)).not.toContain('secret')
	})

	test('drops an invalid Retry-After value', () => {
		const error = toHttpTransportError({ status: 429, retryAfter: 'secret-response-value' }, context)

		expect(error.details).toEqual({ status: 429, url: 'https://example.com/path' })
	})

	test('does not retain a raw HTTP cause', () => {
		const cause = new Error('response included secret-http-cause')
		const error = toHttpTransportError({ status: 500 }, context, cause)

		expect(error.cause).not.toBe(cause)
		expect(inspect(error, { depth: null })).not.toContain('secret-http-cause')
	})

	test('normalizes a rejected fetch as transient', () => {
		const cause = new TypeError('fetch failed with private context')
		const error = toTransportError(cause, context)

		expect(error.code).toBe('TEST_API_UNREACHABLE')
		expect(error.exitCode).toBe(ExitCode.Transient)
		expect(error.retryable).toBe(true)
		expect(error.message).not.toContain(cause.message)
		expect(error.cause).not.toBe(cause)
		expect(inspect(error, { depth: null })).not.toContain('private context')
	})

	test('keeps an existing CliError unchanged', () => {
		const original = new CliError('known failure', { code: 'KNOWN', exitCode: ExitCode.Conflict })

		expect(toTransportError(original, context)).toBe(original)
	})
})
