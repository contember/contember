/**
 * General utility helpers
 */

/** A non-null object; any property read from it is an unknown value */
export type ObjectLike = { readonly [key: PropertyKey]: unknown }

/**
 * The record's own value under the key. Schema records, resolver maps, variables and inputs are plain objects, so a bare
 * index with a name from a document or a request would also find Object.prototype members such as `constructor`.
 */
export function getOwn<V>(record: Readonly<Record<string, V>>, key: string): V | undefined {
	return Object.hasOwn(record, key) ? record[key] : undefined
}

/**
 * Check if value is an object-like (not null, is object)
 */
export function isObjectLike(value: unknown): value is ObjectLike {
	return typeof value === 'object' && value !== null
}

/**
 * Check if value is a Promise (any thenable object, as in graphql-js)
 */
export function isPromise(value: unknown): value is Promise<unknown> {
	return isObjectLike(value) && typeof value.then === 'function'
}

/**
 * Check if value is iterable (array-like)
 */
export function isIterableObject(value: unknown): value is Iterable<unknown> {
	return isObjectLike(value) && typeof value[Symbol.iterator] === 'function'
}

const MAX_ARRAY_LENGTH = 10
const MAX_RECURSIVE_DEPTH = 2

/**
 * Format a value for error messages exactly as graphql-js `inspect` does
 */
export function inspect(value: unknown): string {
	return formatValue(value, [])
}

function formatValue(value: unknown, seenValues: readonly unknown[]): string {
	switch (typeof value) {
		case 'string':
			return JSON.stringify(value)
		case 'function':
			return value.name ? `[function ${value.name}]` : '[function]'
		case 'object':
			return formatObjectValue(value, seenValues)
		default:
			return String(value)
	}
}

function formatObjectValue(value: object | null, previouslySeenValues: readonly unknown[]): string {
	if (value === null) {
		return 'null'
	}
	if (previouslySeenValues.includes(value)) {
		return '[Circular]'
	}
	const seenValues = [...previouslySeenValues, value]
	if ('toJSON' in value && typeof value.toJSON === 'function') {
		const jsonValue: unknown = value.toJSON()
		// check for infinite recursion
		if (jsonValue !== value) {
			return typeof jsonValue === 'string' ? jsonValue : formatValue(jsonValue, seenValues)
		}
	} else if (Array.isArray(value)) {
		return formatArray(value, seenValues)
	}
	return formatObject(value, seenValues)
}

function formatObject(object: object, seenValues: readonly unknown[]): string {
	const entries = Object.entries(object)
	if (entries.length === 0) {
		return '{}'
	}
	if (seenValues.length > MAX_RECURSIVE_DEPTH) {
		return '[' + getObjectTag(object) + ']'
	}
	const properties = entries.map(([key, value]) => key + ': ' + formatValue(value, seenValues))
	return '{ ' + properties.join(', ') + ' }'
}

function formatArray(array: readonly unknown[], seenValues: readonly unknown[]): string {
	if (array.length === 0) {
		return '[]'
	}
	if (seenValues.length > MAX_RECURSIVE_DEPTH) {
		return '[Array]'
	}
	const len = Math.min(MAX_ARRAY_LENGTH, array.length)
	const remaining = array.length - len
	const items: string[] = []
	for (let i = 0; i < len; ++i) {
		items.push(formatValue(array[i], seenValues))
	}
	if (remaining === 1) {
		items.push('... 1 more item')
	} else if (remaining > 1) {
		items.push(`... ${remaining} more items`)
	}
	return '[' + items.join(', ') + ']'
}

function getObjectTag(object: object): string {
	const tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '')
	if (tag === 'Object' && typeof object.constructor === 'function') {
		const name = object.constructor.name
		if (typeof name === 'string' && name !== '') {
			return name
		}
	}
	return tag
}

/**
 * Promise.all for an object of promises
 */
export async function promiseForObject<T>(
	object: Record<string, Promise<T> | T>,
): Promise<Record<string, T>> {
	const keys = Object.keys(object)
	const values = await Promise.all(Object.values(object))

	const result: Record<string, T> = {}
	for (let i = 0; i < keys.length; i++) {
		result[keys[i]] = values[i]
	}
	return result
}

/**
 * Sequential promise reduce
 */
export async function promiseReduce<T, U>(
	values: readonly T[],
	callbackFn: (acc: U, value: T) => U | Promise<U>,
	initialValue: U,
): Promise<U> {
	let acc = initialValue
	for (const value of values) {
		acc = await callbackFn(acc, value)
	}
	return acc
}

/**
 * Simple memoization for 3-argument functions
 */
export function memoize3<
	A1 extends object,
	A2 extends object,
	A3 extends object,
	R,
>(fn: (a1: A1, a2: A2, a3: A3) => R): (a1: A1, a2: A2, a3: A3) => R {
	const cache0 = new WeakMap<A1, WeakMap<A2, WeakMap<A3, R>>>()

	return function memoized(a1: A1, a2: A2, a3: A3): R {
		let cache1 = cache0.get(a1)
		if (!cache1) {
			cache1 = new WeakMap()
			cache0.set(a1, cache1)
		}

		let cache2 = cache1.get(a2)
		if (!cache2) {
			cache2 = new WeakMap()
			cache1.set(a2, cache2)
		}

		let result = cache2.get(a3)
		if (result === undefined) {
			result = fn(a1, a2, a3)
			cache2.set(a3, result)
		}

		return result
	}
}
