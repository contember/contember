type Unpacked<T> = T extends readonly (infer U)[] ? U : never

export type Type<T> = (input: unknown, path?: PropertyKey[]) => T

export class ParseError extends Error {
	constructor(readonly path: PropertyKey[], readonly reason: string, readonly expected?: string) {
		super(`value at path /${path.join('/')}: ${reason}`)
	}

	static format(input: unknown, path: PropertyKey[], expected: string) {
		return new ParseError(path, `must be ${expected}, ${typeof input} given`, expected)
	}
}

export const fail = (path: PropertyKey[], reason: string = 'unknown reason'): never => {
	throw new ParseError(path, reason)
}

export const string = (input: unknown, path: PropertyKey[] = []) => {
	if (typeof input !== 'string') throw ParseError.format(input, path, 'string')
	return input
}

export const number = (input: unknown, path: PropertyKey[] = []) => {
	if (typeof input !== 'number') throw ParseError.format(input, path, 'number')
	return input
}

export const boolean = (input: unknown, path: PropertyKey[] = []) => {
	if (typeof input !== 'boolean') throw ParseError.format(input, path, 'boolean')
	return input
}

export const literal = <T>(inner: T) => (input: unknown, path: PropertyKey[] = []): T => {
	if (input !== inner) throw ParseError.format(input, path, JSON.stringify(inner))
	return inner
}

export const array = <T>(inner: Type<T>) => (input: unknown, path: PropertyKey[] = []): readonly T[] => {
	if (!Array.isArray(input)) throw ParseError.format(input, path, 'array')
	return input.map((v, i) => inner(v, [...path, i]))
}

type ReadonlyRecord<K extends keyof any, T> = {
	readonly [P in K]: T;
}

type ObjectParams = ReadonlyRecord<string, Type<any>>

export const object = <Items extends ObjectParams>(required: Items): Type<{ readonly [K in keyof Items]: ReturnType<Items[K]> }> =>
	(input: unknown, path: PropertyKey[] = []) => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		return Object.fromEntries(
			Object.entries(required).map(([k, v]) => {
				const newPath = [...path, k]
				const result = v((input as any)[k], newPath)
				if (result === undefined && !(k in (input as object))) {
					throw ParseError.format(undefined, newPath, 'defined')
				}
				return [k, result]
			}),
		) as any
	}

export const partial = <Items extends ObjectParams>(items: Items): Type<{ readonly [K in keyof Items]?: Exclude<ReturnType<Items[K]>, undefined> }> =>
	(input: unknown, path: PropertyKey[] = []) => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		return Object.fromEntries(Object.entries(items ?? {}).flatMap(([k, v]) => {
			const newPath = [...path, k]
			if (!(k in (input as object))) {
				return []
			}
			const val = v((input as any)[k], newPath)
			if (val === undefined) {
				return []
			}
			return [[k, val]]
		})) as any
	}

export const union = <T extends Type<any>[]>(...inner: T) => (input: unknown, path: PropertyKey[] = []): ReturnType<Unpacked<T>> => {
	const expected = []
	for (const innerInner of inner) {
		try {
			return innerInner(input, path) as any
		} catch (e) {
			if (e instanceof ParseError) {
				if (e.expected) {
					expected.push(e.expected)
				}
			} else {
				throw e
			}
		}
	}
	throw ParseError.format(input, path, expected.join('|'))
}

export const intersection = <T1 extends ReadonlyRecord<string, any>, T2 extends ReadonlyRecord<string, any>>(inner1: Type<T1>, inner2: Type<T2>): Type<T1 & T2> => (input, path = []) => {
	return {
		...inner1(input, path),
		...inner2(input, path),
	}
}

export const enumeration = <T extends string>(...values: T[]) => (input: unknown, path: PropertyKey[] = []): T => {
	if (typeof input !== 'string' || !values.includes(input as T)) throw ParseError.format(input, path, values.join('|'))
	return input as T
}

export const transform = <Input, Result>(inner: Type<Input>, transform: (value: Input, input: unknown) => Result) => (input: unknown, path: PropertyKey[] = []): Result => {
	return transform(inner(input, path), input)
}

export const map = <T>(inner: Type<T>) => (input: unknown, path: PropertyKey[] = []): Record<string, T> => {
	if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
	return Object.fromEntries(Object.entries(input as any).map(([key, value]) => [key, inner(value, [...path, key])]))
}

export const NULL = literal(null)
export const TRUE = literal(true)
export const FALSE = literal(false)

export const valueAt = (input: unknown, path: PropertyKey[]): any => {
	let value = input
	for (const key of path) {
		if (typeof value !== 'object' || value === null) {
			return undefined
		}
		value = (value as any)[key]
	}
	return value
}

export const nullable = <T>(inner: Type<T>) => union(NULL, inner)
