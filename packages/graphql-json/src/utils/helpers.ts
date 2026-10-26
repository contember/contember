/**
 * General utility helpers
 */

/** A non-null object; any property read from it is an unknown value */
export type ObjectLike = { readonly [key: PropertyKey]: unknown }

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

/**
 * Inspect a value for error messages
 */
export function inspect(value: unknown): string {
	if (value === null) {
		return 'null'
	}
	if (value === undefined) {
		return 'undefined'
	}
	if (typeof value === 'string') {
		return JSON.stringify(value)
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}
	if (typeof value === 'function') {
		return value.name ? `[function ${value.name}]` : '[function]'
	}
	if (Array.isArray(value)) {
		return `[${value.map(inspect).join(', ')}]`
	}
	if (typeof value === 'object') {
		const name = value.constructor?.name
		if (name && name !== 'Object') {
			return `[${name}]`
		}
		const entries = Object.entries(value)
			.slice(0, 3)
			.map(([k, v]) => `${k}: ${inspect(v)}`)
		if (Object.keys(value).length > 3) {
			entries.push('...')
		}
		return `{ ${entries.join(', ')} }`
	}
	return String(value)
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
