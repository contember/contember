import { beforeAll, describe, expect, test } from 'bun:test'
import chalk from 'chalk'
import { CliError, ExitCode, InvalidInputError, renderCliError, toCliError } from '../../../src/index.js'
import { createTestOutput } from '../../lib/testOutput.js'

beforeAll(() => {
	chalk.level = 0
})

describe('toCliError', () => {
	test('passes a CliError through', () => {
		const error = new CliError('nope', { code: 'FORBIDDEN', exitCode: ExitCode.Forbidden })
		expect(toCliError(error)).toBe(error)
	})

	test('maps an InvalidInputError to an input error', () => {
		const error = toCliError(new InvalidInputError('bad option'))
		expect(error.code).toBe('INVALID_INPUT')
		expect(error.exitCode).toBe(ExitCode.InputError)
	})

	test('maps a thrown string to an input error', () => {
		const error = toCliError('Project not defined')
		expect(error.exitCode).toBe(ExitCode.InputError)
		expect(error.message).toBe('Project not defined')
	})

	test('maps an unexpected error to an internal error', () => {
		const error = toCliError(new Error('boom'))
		expect(error.code).toBe('UNKNOWN')
		expect(error.exitCode).toBe(ExitCode.InternalError)
	})

	test('maps an unknown throw to an internal error', () => {
		const error = toCliError({ weird: true })
		expect(error.code).toBe('UNKNOWN')
		expect(error.exitCode).toBe(ExitCode.InternalError)
	})
})

describe('CliError defaults', () => {
	test('a transient error is retryable', () => {
		expect(new CliError('timeout', { code: 'TIMEOUT', exitCode: ExitCode.Transient }).retryable).toBe(true)
	})

	test('other errors are not retryable', () => {
		expect(new CliError('nope', { code: 'FORBIDDEN', exitCode: ExitCode.Forbidden }).retryable).toBe(false)
	})

	test('an explicit retryable flag wins', () => {
		expect(new CliError('nope', { code: 'FORBIDDEN', exitCode: ExitCode.Forbidden, retryable: true }).retryable).toBe(true)
	})
})

describe('renderCliError', () => {
	test('human mode prints a one-liner to stderr', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('human')
		const exitCode = renderCliError(new CliError('nope', { code: 'FORBIDDEN', exitCode: ExitCode.Forbidden }), output)
		expect(exitCode).toBe(ExitCode.Forbidden)
		expect(stdout.text).toBe('')
		expect(stderr.text).toBe('Error [FORBIDDEN]: nope\n')
	})

	test('json mode prints the envelope to stderr', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')
		const exitCode = renderCliError(new CliError('nope', { code: 'CONFLICT', exitCode: ExitCode.Conflict, details: { id: 1 } }), output)
		expect(exitCode).toBe(ExitCode.Conflict)
		expect(stdout.text).toBe('')
		expect(JSON.parse(stderr.text)).toStrictEqual({
			ok: false,
			error: { code: 'CONFLICT', message: 'nope', retryable: false, details: { id: 1 } },
		})
	})

	test('normalizes circular and bigint details before JSON rendering', () => {
		const details: Record<string, unknown> = { count: 2n }
		details.self = details
		const { output, stderr } = createTestOutput()
		output.setMode('json')
		const exitCode = renderCliError(new CliError('broken', { code: 'BROKEN', details }), output)
		expect(exitCode).toBe(ExitCode.InputError)
		expect(JSON.parse(stderr.text).error.details).toStrictEqual({ count: '2', self: '[Circular]' })
	})

	test('sanitizes an untrusted human error message', () => {
		const { output, stderr } = createTestOutput()
		output.setMode('human')
		renderCliError(new CliError('broken\u001b[2J\u0007', { code: 'BAD\u001b' }), output)
		expect(stderr.text).toBe('Error [BAD]: broken[2J\n')
	})

	test('quiet mode still prints the error', () => {
		const { output, stderr } = createTestOutput()
		output.setMode('quiet')
		expect(renderCliError('broken', output)).toBe(ExitCode.InputError)
		expect(stderr.text).toContain('broken')
	})
})
