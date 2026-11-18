/**
 * Test utilities compatible with graphql-js test patterns
 */

import { expect } from 'bun:test'

/**
 * Helper to convert values to JSON-compatible format
 * Handles toJSON() methods, undefined -> null conversion, etc.
 */
function toJSONDeep(value: unknown): unknown {
	if (value === undefined) {
		return undefined
	}

	if (value === null) {
		return null
	}

	if (typeof value === 'object') {
		if (typeof (value as any).toJSON === 'function') {
			return toJSONDeep((value as any).toJSON())
		}

		if (Array.isArray(value)) {
			return value.map(toJSONDeep)
		}

		const result: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			result[key] = toJSONDeep(val)
		}
		return result
	}

	return value
}

/**
 * Wrapper for assertions that handles JSON conversion
 * Compatible with graphql-js expectJSON utility
 */
export function expectJSON(actual: unknown) {
	const actualJSON = toJSONDeep(actual)

	return {
		toDeepEqual(expected: unknown) {
			const expectedJSON = toJSONDeep(expected)
			expect(actualJSON).toEqual(expectedJSON)
		},

		toDeepNestedProperty(path: string, expected: unknown) {
			const parts = path.split('.')
			let current: any = actualJSON
			for (const part of parts) {
				if (current === null || current === undefined) {
					throw new Error(`Cannot access property "${part}" of ${current}`)
				}
				current = current[part]
			}
			expect(current).toEqual(toJSONDeep(expected))
		},
	}
}

/**
 * Helper to test that a function throws
 */
export function expectToThrowJSON(fn: () => unknown) {
	return {
		toThrow(expectedMessage?: string | RegExp) {
			let threw = false
			let error: Error | undefined

			try {
				fn()
			} catch (e) {
				threw = true
				error = e as Error
			}

			expect(threw).toBe(true)

			if (expectedMessage && error) {
				if (typeof expectedMessage === 'string') {
					expect(error.message).toContain(expectedMessage)
				} else {
					expect(error.message).toMatch(expectedMessage)
				}
			}

			return error
		},
	}
}

/**
 * Helper for async tick resolution
 */
export function resolveOnNextTick<T>(value: T): Promise<T> {
	return Promise.resolve().then(() => value)
}

/**
 * Invariant check helper
 */
export function invariant(condition: unknown, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message ?? 'Invariant violation')
	}
}

/**
 * Simple inspect function for debugging
 */
export function inspect(value: unknown): string {
	if (value === null) return 'null'
	if (value === undefined) return 'undefined'
	if (typeof value === 'string') return JSON.stringify(value)
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`
	if (Array.isArray(value)) return `[${value.map(inspect).join(', ')}]`
	if (typeof value === 'object') {
		const name = value.constructor?.name
		if (name && name !== 'Object') {
			return name
		}
		const entries = Object.entries(value)
			.map(([k, v]) => `${k}: ${inspect(v)}`)
			.join(', ')
		return `{ ${entries} }`
	}
	return String(value)
}
