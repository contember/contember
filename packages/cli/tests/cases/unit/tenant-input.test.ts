import { describe, expect, test } from 'bun:test'
import { CliError } from '@contember/cli-common'
import {
	environmentInput,
	GRAPHQL_INT_MAX,
	literalInput,
	parsePaginationLimit,
	parsePaginationOffset,
	resolveOptionalTenantInput,
	resolveRequiredTenantInput,
	stdinInput,
} from '../../../src/lib/tenant/input/index.js'

const getCliError = async (operation: () => Promise<unknown>): Promise<CliError> => {
	try {
		await operation()
		throw new Error('Expected operation to fail.')
	} catch (error) {
		if (error instanceof CliError) {
			return error
		}
		throw error
	}
}

describe('tenant input source resolution', () => {
	test.each([
		{
			name: 'literal',
			source: literalInput('content', '--content', 'literal bytes'),
			expected: { name: 'content', kind: 'literal', value: 'literal bytes' },
		},
		{
			name: 'environment',
			source: environmentInput('content', '--content-env', 'CONTENT'),
			expected: { name: 'content', kind: 'environment', value: 'environment bytes' },
		},
		{
			name: 'stdin',
			source: stdinInput('content', '--content-stdin'),
			expected: { name: 'content', kind: 'stdin', value: 'stdin bytes' },
		},
	])('resolves an explicitly selected $name source', async ({ source, expected }) => {
		const result = await resolveRequiredTenantInput([source], { label: 'content' }, {
			readEnvironment: name => name === 'CONTENT' ? 'environment bytes' : undefined,
			readStdin: async () => 'stdin bytes',
		})

		expect(result).toEqual(expected)
	})

	test('required input rejects a missing source with a stable code', async () => {
		const error = await getCliError(() => resolveRequiredTenantInput([], { label: 'password' }))

		expect(error.code).toBe('MISSING_INPUT_SOURCE')
		expect(error.message).toBe('Select an input source for password.')
	})

	test('optional input returns undefined without an implicit stdin read', async () => {
		let reads = 0
		const result = await resolveOptionalTenantInput([], { label: 'captcha token' }, {
			readStdin: async () => {
				reads++
				return 'must not be read'
			},
		})

		expect(result).toBeUndefined()
		expect(reads).toBe(0)
	})

	test('rejects multiple selected sources without reading any of them', async () => {
		let reads = 0
		const error = await getCliError(() =>
			resolveOptionalTenantInput(
				[
					literalInput('secret', '--value', 'do-not-echo'),
					stdinInput('secret', '--value-stdin'),
				],
				{ label: 'project secret' },
				{
					readStdin: async () => {
						reads++
						return 'also-secret'
					},
				},
			)
		)

		expect(error.code).toBe('AMBIGUOUS_INPUT_SOURCE')
		expect(error.message).toContain('--value, --value-stdin')
		expect(error.message).not.toContain('do-not-echo')
		expect(error.message).not.toContain('also-secret')
		expect(reads).toBe(0)
	})

	test.each([
		['plain bytes', 'plain bytes'],
		['  spaces and tabs\t  ', '  spaces and tabs\t  '],
		['one newline\n', 'one newline\n'],
		['windows newline\r\n', 'windows newline\r\n'],
		['multiple newlines\n\n', 'multiple newlines\n\n'],
	])('preserves literal bytes by default', async (input, expected) => {
		const result = await resolveRequiredTenantInput(
			[literalInput('value', '--value', input)],
			{ label: 'value' },
		)

		expect(result.value).toBe(expected)
	})

	test.each([
		['value\n', 'value'],
		['value\r\n', 'value'],
		['value\n\n', 'value\n'],
		['value\r\n\r\n', 'value\r\n'],
		['  value  \n', '  value  '],
		['value\r', 'value\r'],
	])('removes exactly one LF or CRLF only when requested', async (input, expected) => {
		const result = await resolveRequiredTenantInput(
			[stdinInput('value', '--value-stdin')],
			{ label: 'value', trailingLineEnding: 'remove-one' },
			{ readStdin: async () => input },
		)

		expect(result.value).toBe(expected)
	})

	test.each(['\n', '\r\n'])('rejects an empty value after removing one trailing line ending', async input => {
		const error = await getCliError(() =>
			resolveRequiredTenantInput(
				[stdinInput('value', '--value-stdin')],
				{ label: 'value', trailingLineEnding: 'remove-one' },
				{ readStdin: async () => input },
			)
		)

		expect(error.code).toBe('EMPTY_INPUT_VALUE')
	})

	test.each(['\n', '\r\n'])('allows an empty value after removing one trailing line ending when requested', async input => {
		const result = await resolveRequiredTenantInput(
			[stdinInput('value', '--value-stdin')],
			{ label: 'value', trailingLineEnding: 'remove-one', allowEmpty: true },
			{ readStdin: async () => input },
		)

		expect(result.value).toBe('')
	})

	test.each([
		{
			name: 'empty literal',
			source: literalInput('secret', '--value', ''),
			dependencies: {},
			code: 'EMPTY_INPUT_VALUE',
			secret: 'not-present',
		},
		{
			name: 'empty environment value',
			source: environmentInput('secret', '--value-env', 'SECRET_VALUE'),
			dependencies: { readEnvironment: () => '' },
			code: 'EMPTY_INPUT_VALUE',
			secret: 'not-present',
		},
		{
			name: 'unset environment value',
			source: environmentInput('secret', '--value-env', 'SECRET_VALUE'),
			dependencies: { readEnvironment: () => undefined },
			code: 'INPUT_ENV_NOT_SET',
			secret: 'not-present',
		},
	])('reports $name without submitted values', async ({ source, dependencies, code, secret }) => {
		const error = await getCliError(() => resolveRequiredTenantInput([source], { label: 'project secret' }, dependencies))

		expect(error.code).toBe(code)
		expect(error.message).not.toContain(secret)
	})

	test('allows an explicitly selected empty value when requested', async () => {
		const result = await resolveRequiredTenantInput(
			[literalInput('content', '--content', '')],
			{ label: 'mail content', allowEmpty: true },
		)

		expect(result.value).toBe('')
	})
})

describe('tenant pagination input', () => {
	test.each([
		[undefined, undefined],
		['0', 0],
		['1', 1],
		['123', 123],
		[String(GRAPHQL_INT_MAX), GRAPHQL_INT_MAX],
	])('accepts offset %p', (input, expected) => {
		expect(parsePaginationOffset(input)).toBe(expected)
	})

	test.each([
		[undefined, undefined],
		['1', 1],
		['123', 123],
		[String(GRAPHQL_INT_MAX), GRAPHQL_INT_MAX],
	])('accepts limit %p', (input, expected) => {
		expect(parsePaginationLimit(input)).toBe(expected)
	})

	test.each([
		['0', 'INVALID_PAGINATION_LIMIT'],
		['-1', 'INVALID_PAGINATION_LIMIT'],
		['1.5', 'INVALID_PAGINATION_LIMIT'],
		['value', 'INVALID_PAGINATION_LIMIT'],
		['', 'INVALID_PAGINATION_LIMIT'],
		[String(GRAPHQL_INT_MAX + 1), 'INVALID_PAGINATION_LIMIT'],
		[String(Number.MAX_SAFE_INTEGER), 'INVALID_PAGINATION_LIMIT'],
		['9007199254740992', 'INVALID_PAGINATION_LIMIT'],
	])('rejects invalid limit %p', (input, code) => {
		try {
			parsePaginationLimit(input)
			throw new Error('Expected parser to fail.')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (error instanceof CliError) {
				expect(error.code).toBe(code)
				expect(error.message).toBe(`--limit must be a positive GraphQL Int (maximum ${GRAPHQL_INT_MAX}).`)
			}
		}
	})

	test.each([
		['-1', 'INVALID_PAGINATION_OFFSET'],
		['1.5', 'INVALID_PAGINATION_OFFSET'],
		['value', 'INVALID_PAGINATION_OFFSET'],
		['', 'INVALID_PAGINATION_OFFSET'],
		[String(GRAPHQL_INT_MAX + 1), 'INVALID_PAGINATION_OFFSET'],
		[String(Number.MAX_SAFE_INTEGER), 'INVALID_PAGINATION_OFFSET'],
		['9007199254740992', 'INVALID_PAGINATION_OFFSET'],
	])('rejects invalid offset %p', (input, code) => {
		try {
			parsePaginationOffset(input)
			throw new Error('Expected parser to fail.')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (error instanceof CliError) {
				expect(error.code).toBe(code)
				expect(error.message).toBe(`--offset must be a non-negative GraphQL Int (maximum ${GRAPHQL_INT_MAX}).`)
			}
		}
	})

	test('uses the same message format for domain-specific flag names', () => {
		const cases: ReadonlyArray<{
			parse: (value: string | undefined, flag?: string) => number | undefined
			flag: string
			requirement: string
		}> = [
			{ parse: parsePaginationOffset, flag: '--auth-log-offset', requirement: `a non-negative GraphQL Int (maximum ${GRAPHQL_INT_MAX})` },
			{ parse: parsePaginationLimit, flag: '--person-limit', requirement: `a positive GraphQL Int (maximum ${GRAPHQL_INT_MAX})` },
		]
		for (const { parse, flag, requirement } of cases) {
			try {
				parse('invalid', flag)
				throw new Error('Expected parser to fail.')
			} catch (error) {
				if (error instanceof CliError) {
					expect(error.message).toBe(`${flag} must be ${requirement}.`)
				} else {
					throw error
				}
			}
		}
	})
})
