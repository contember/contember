// JSON-safe copies of arbitrary values, as @sentry/node 7 produced them: depth- and breadth-limited, cycle-free.

const constructorName = (value: object): string => {
	const prototype: unknown = Object.getPrototypeOf(value)
	if (prototype === null) {
		return 'null prototype'
	}
	const constructor: unknown = typeof prototype === 'object' ? Reflect.get(prototype, 'constructor') : undefined
	return typeof constructor === 'function' ? constructor.name : 'Object'
}

/** A placeholder string for values that are not plain data, or `undefined` for objects to walk into. */
const describe = (value: unknown): string | undefined => {
	if (typeof value === 'number') {
		return '[NaN]'
	}
	if (typeof value === 'function') {
		return `[Function: ${value.name || '<anonymous>'}]`
	}
	if (typeof value === 'symbol') {
		return `[${String(value)}]`
	}
	if (typeof value === 'bigint') {
		return `[BigInt: ${String(value)}]`
	}
	if (value === globalThis) {
		return '[Global]'
	}
	return undefined
}

const entriesOf = (value: object): [string, unknown][] => {
	if (value instanceof Error) {
		return [['message', value.message], ['name', value.name], ['stack', value.stack], ...Object.entries(value)]
	}
	return Object.entries(value)
}

const visit = (value: unknown, depth: number, breadth: number, path: Set<object>): unknown => {
	if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'string') {
		return value
	}
	if (typeof value === 'number' && !Number.isNaN(value)) {
		return value
	}
	const described = describe(value)
	if (described !== undefined || typeof value !== 'object') {
		return described
	}
	if (depth === 0) {
		return `[${constructorName(value)}]`
	}
	if (path.has(value)) {
		return '[Circular ~]'
	}
	const toJSON: unknown = Reflect.get(value, 'toJSON')
	if (typeof toJSON === 'function') {
		try {
			return visit(toJSON.call(value), depth - 1, breadth, path)
		} catch {
			// fall back to the properties
		}
	}
	path.add(value)
	const isArray = Array.isArray(value)
	const result: Record<string, unknown> = {}
	const items: unknown[] = []
	let added = 0
	for (const [key, item] of entriesOf(value)) {
		if (added >= breadth) {
			if (isArray) {
				items.push('[MaxProperties ~]')
			} else {
				result[key] = '[MaxProperties ~]'
			}
			break
		}
		const normalized = visit(item, depth - 1, breadth, path)
		if (isArray) {
			items.push(normalized)
		} else {
			result[key] = normalized
		}
		added++
	}
	path.delete(value)
	return isArray ? items : result
}

export const normalize = (value: unknown, depth: number, breadth: number): unknown => {
	try {
		return visit(value, depth, breadth, new Set())
	} catch (error) {
		return { ERROR: `**non-serializable** (${error})` }
	}
}

/** Like `normalize`, one level shallower at a time until its JSON fits `maxBytes`, as @sentry/node 7 did for `__serialized__`. */
export const normalizeToSize = (value: unknown, depth: number, breadth: number, maxBytes: number): unknown => {
	const normalized = normalize(value, depth, breadth)
	return depth > 0 && Buffer.byteLength(JSON.stringify(normalized) ?? '') > maxBytes
		? normalizeToSize(value, depth - 1, breadth, maxBytes)
		: normalized
}

/** Like `normalize`, for a value that must stay a record (`extra`, `contexts`, `user`). */
export const normalizeRecord = (value: Readonly<Record<string, unknown>>, depth: number, breadth: number): Record<string, unknown> => {
	const normalized = normalize(value, depth, breadth)
	return typeof normalized === 'object' && normalized !== null && !Array.isArray(normalized) ? { ...normalized } : { value: normalized }
}

export const truncate = (value: string, maxLength: number): string => value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`
