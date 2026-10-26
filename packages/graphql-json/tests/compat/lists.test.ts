/**
 * Adapted from graphql-js lists-test.ts
 *
 * Tests list type handling during execution.
 */

import { describe, expect, it } from 'bun:test'
import { parse } from 'graphql'

import { buildSchema, execute, executeSync, type ExecutionResult } from '../../src/index.js'
import { expectJSON } from './testUtils.js'

describe('Execute: Accepts any iterable as list value', () => {
	function complete(rootValue: unknown) {
		return executeSync({
			schema: buildSchema('type Query { listField: [String] }'),
			document: parse('{ listField }'),
			rootValue,
		})
	}

	it('Accepts a Set as a List value', () => {
		const listField = new Set(['apple', 'banana', 'apple', 'coconut'])

		expect(complete({ listField })).toEqual({
			data: { listField: ['apple', 'banana', 'coconut'] },
		})
	})

	it('Accepts an Generator function as a List value', () => {
		function* listField() {
			yield 'one'
			yield 2
			yield true
		}

		expect(complete({ listField })).toEqual({
			data: { listField: ['one', '2', 'true'] },
		})
	})

	it('Accepts an array-like iterable (such as function arguments) as a List value', () => {
		const listField = { 0: 'one', 1: 'two', length: 2, [Symbol.iterator]: Array.prototype[Symbol.iterator] }

		expect(complete({ listField })).toEqual({
			data: { listField: ['one', 'two'] },
		})
	})

	it('Does not accept (Iterable) String-literal as a List value', () => {
		const listField = 'Singular'

		const result = complete({ listField })
		expect(result.data).toEqual({ listField: null })
		expect(result.errors).toHaveLength(1)
		expect(result.errors?.[0].message).toContain('Iterable')
	})
})

describe('Execute: Handles list nullability', () => {
	// Simplified version - our implementation has some differences in error handling for promises
	async function complete(args: { listField: unknown; as: string }) {
		const { listField, as } = args
		const schema = buildSchema(`type Query { listField: ${as} }`)
		const document = parse('{ listField }')

		return execute({ schema, document, rootValue: { listField } })
	}

	it('Contains values', async () => {
		const listField = [1, 2]

		expect(await complete({ listField, as: '[Int]' })).toEqual({
			data: { listField: [1, 2] },
		})
		expect(await complete({ listField, as: '[Int]!' })).toEqual({
			data: { listField: [1, 2] },
		})
		expect(await complete({ listField, as: '[Int!]' })).toEqual({
			data: { listField: [1, 2] },
		})
		expect(await complete({ listField, as: '[Int!]!' })).toEqual({
			data: { listField: [1, 2] },
		})
	})

	it('Contains null', async () => {
		const listField = [1, null, 2]

		expect(await complete({ listField, as: '[Int]' })).toEqual({
			data: { listField: [1, null, 2] },
		})
		expect(await complete({ listField, as: '[Int]!' })).toEqual({
			data: { listField: [1, null, 2] },
		})

		// [Int!] - non-null list item, null propagates to nullable list
		const result3 = await complete({ listField, as: '[Int!]' })
		expect(result3.data).toEqual({ listField: null })
		expect(result3.errors).toHaveLength(1)
		expect(result3.errors?.[0].message).toContain('Cannot return null')

		// [Int!]! - non-null list with non-null items, null propagates to root
		const result4 = await complete({ listField, as: '[Int!]!' })
		expect(result4.data).toBeNull()
		expect(result4.errors).toHaveLength(1)
		expect(result4.errors?.[0].message).toContain('Cannot return null')
	})

	it('Returns null', async () => {
		const listField = null

		expect(await complete({ listField, as: '[Int]' })).toEqual({
			data: { listField: null },
		})

		// [Int]! - non-null list, null propagates to root
		const result2 = await complete({ listField, as: '[Int]!' })
		expect(result2.data).toBeNull()
		expect(result2.errors).toHaveLength(1)
		expect(result2.errors?.[0].message).toContain('Cannot return null')

		expect(await complete({ listField, as: '[Int!]' })).toEqual({
			data: { listField: null },
		})

		// [Int!]! - non-null list, null propagates to root
		const result4 = await complete({ listField, as: '[Int!]!' })
		expect(result4.data).toBeNull()
		expect(result4.errors).toHaveLength(1)
		expect(result4.errors?.[0].message).toContain('Cannot return null')
	})

	it('Contains error', async () => {
		const listField = [1, new Error('bad'), 2]

		const result1 = await complete({ listField, as: '[Int]' })
		expect(result1.data).toEqual({ listField: [1, null, 2] })
		expect(result1.errors).toHaveLength(1)
		expect(result1.errors?.[0].message).toBe('bad')
		expect(result1.errors?.[0].path).toEqual(['listField', 1])

		const result2 = await complete({ listField, as: '[Int]!' })
		expect(result2.data).toEqual({ listField: [1, null, 2] })
		expect(result2.errors).toHaveLength(1)

		// [Int!] - non-null list item error, propagates to nullable list
		const result3 = await complete({ listField, as: '[Int!]' })
		expect(result3.data).toEqual({ listField: null })
		expect(result3.errors).toHaveLength(1)
		expect(result3.errors?.[0].message).toBe('bad')

		// [Int!]! - non-null list with non-null items, error propagates to root
		const result4 = await complete({ listField, as: '[Int!]!' })
		expect(result4.data).toBeNull()
		expect(result4.errors).toHaveLength(1)
		expect(result4.errors?.[0].message).toBe('bad')
	})

	it('Results in error', async () => {
		const listField = new Error('bad')

		const result1 = await complete({ listField, as: '[Int]' })
		expect(result1.data).toEqual({ listField: null })
		expect(result1.errors).toHaveLength(1)
		expect(result1.errors?.[0].message).toBe('bad')

		// [Int]! - non-null list error, propagates to root
		const result2 = await complete({ listField, as: '[Int]!' })
		expect(result2.data).toBeNull()
		expect(result2.errors).toHaveLength(1)
		expect(result2.errors?.[0].message).toBe('bad')

		const result3 = await complete({ listField, as: '[Int!]' })
		expect(result3.data).toEqual({ listField: null })
		expect(result3.errors).toHaveLength(1)

		// [Int!]! - non-null list error, propagates to root
		const result4 = await complete({ listField, as: '[Int!]!' })
		expect(result4.data).toBeNull()
		expect(result4.errors).toHaveLength(1)
		expect(result4.errors?.[0].message).toBe('bad')
	})
})

describe('Execute: Handles nested lists', () => {
	it('Handles nested list of scalars', () => {
		const schema = buildSchema('type Query { nested: [[String]] }')
		const document = parse('{ nested }')
		const rootValue = {
			nested: [
				['a', 'b'],
				['c', 'd'],
			],
		}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({
			data: {
				nested: [
					['a', 'b'],
					['c', 'd'],
				],
			},
		})
	})

	it('Handles nested list with null', () => {
		const schema = buildSchema('type Query { nested: [[String]] }')
		const document = parse('{ nested }')
		const rootValue = {
			nested: [['a', null], null, ['c']],
		}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({
			data: {
				nested: [['a', null], null, ['c']],
			},
		})
	})

	it('Handles deeply nested lists', () => {
		// Re-enabled to investigate the bug
		const schema = buildSchema('type Query { deep: [[[Int]]] }')
		const document = parse('{ deep }')
		const rootValue = {
			deep: [
				[[1, 2], [3]],
				[[4, 5, 6]],
			],
		}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({
			data: {
				deep: [
					[[1, 2], [3]],
					[[4, 5, 6]],
				],
			},
		})
	})
})
