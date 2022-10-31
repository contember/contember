import { isDeepStrictEqual } from 'util'

type Unpacked<T> = T extends readonly (infer U)[] ? U : never

export type JsonObject = {
	readonly [P in string]?: Json
}
export type Scalar =
	| string
	| number
	| boolean
	| null
export type Json =
	| Scalar
	| readonly Json[]
	| JsonObject

export interface Type<T extends Json | {readonly [K in string]?: Json} | undefined = Json> {
	(input: unknown, path?: PropertyKey[]): T
	readonly inner?: any
}

export class ParseError extends Error {
	constructor(readonly path: PropertyKey[], readonly reason: string, readonly expected?: string) {
		super(`value at ${path.length ? `path /${path.join('/')}` : 'root'}: ${reason}`)
	}

	static format(input: unknown, path: PropertyKey[], expected: string) {
		return new ParseError(path, `must be ${expected}, ${input === 'undefined' ? 'undefined' : JSON.stringify(input)} given`, expected)
	}
}

export const fail = (path: PropertyKey[], reason: string = 'unknown reason'): never => {
	throw new ParseError(path, reason)
}

export const string = ((): Type<string> => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'string') throw ParseError.format(input, path, 'string')
		return input
	}
})()

export const number = ((): Type<number> => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'number') throw ParseError.format(input, path, 'number')
		return input
	}
})()

export const integer = ((): Type<number> => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'number' || !Number.isInteger(input)) throw ParseError.format(input, path, 'integer')
		return input
	}
})()

export const boolean = ((): Type<boolean> => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'boolean') throw ParseError.format(input, path, 'boolean')
		return input
	}
})()


export const scalar = ((): Type<Scalar> => {
	return (input: unknown, path: PropertyKey[] = []): Scalar => {
		if (input === null) {
			return null
		}
		switch (typeof input) {
			case 'string':
			case 'boolean':
				return input
			case 'number':
				if (!Number.isFinite(input)) {
					throw new ParseError(path, 'must be finite number', 'number')
				}
				return input
			default:
				throw ParseError.format(input, path, 'string|boolean|number')
		}
	}
})()

export const anyJson = ((): Type<Json> => {
	return (input: unknown, path: PropertyKey[] = []): Json => {
		switch (typeof input) {
			case 'string':
			case 'boolean':
				return input
			case 'number':
				if (!Number.isFinite(input)) {
					throw new ParseError(path, 'must be finite number', 'number')
				}
				return input
			case 'object':
				if (input === null) {
					return null
				}
				if (Array.isArray(input)) {
					return input.map((it, index) => anyJson(it, [...path, index]))
				}
				return anyJsonObject(input, path)
			default:
				throw ParseError.format(input, path, 'string|boolean|number|object')
		}
	}
})()

export const anyJsonObject = ((): Type<JsonObject> => {
	return (input: unknown, path: PropertyKey[] = []): JsonObject => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		return Object.fromEntries(Object.entries(input).map(([key, value]) => {
			return [key, anyJson(value, [...path, key])]
		}))
	}
})()

export const literal = <T extends Json>(inner: T): Type<T> => {
	const type = (input: unknown, path: PropertyKey[] = []): T => {
		if (input !== inner) throw ParseError.format(input, path, JSON.stringify(inner))
		return inner
	}

	type.inner = inner

	return type
}

export const array = <T extends Json>(inner: Type<T>): Type<readonly T[]> => {
	const type = (input: unknown, path: PropertyKey[] = []): readonly T[] => {
		if (!Array.isArray(input)) throw ParseError.format(input, path, 'array')
		return input.map((v, i) => inner(v, [...path, i]))
	}

	type.inner = type

	return type
}

export const object = <T extends Record<string, Type<Json>>>(inner: T): Type<{ readonly [P in keyof T]: ReturnType<T[P]> }> => {
	const type = (input: unknown, path: PropertyKey[] = []): { readonly [P in keyof T]: ReturnType<T[P]> } => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		return Object.fromEntries(
			Object.entries(inner).map(([k, v]) => {
				const newPath = [...path, k]
				const result = v((input as any)[k], newPath)
				if (result === undefined && !(k in (input as object))) {
					throw ParseError.format(undefined, newPath, 'defined')
				}
				return [k, result]
			}),
		) as any
	}

	type.inner = inner

	return type
}

export const partial = <T extends Record<string, Type<Json | undefined>>>(inner: T) => {
	const type = (input: unknown, path: PropertyKey[] = []): { readonly [P in keyof T]?: Exclude<ReturnType<T[P]>, undefined> } => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		return Object.fromEntries(Object.entries(inner ?? {}).flatMap(([k, v]) => {
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

	type.inner = inner

	return type
}

export const noExtraProps = <T extends JsonObject>(inner: Type<T>) => {
	const type = (input: unknown, path: PropertyKey[] = []): T => {
		const result = inner(input, path)
		if (!(typeof input === 'object' && typeof input !== null && typeof result === 'object' && result !== null)) {
			return result
		}
		const resultProps = new Set(Object.keys(result))
		for (const key in input) {
			if (!resultProps.has(key)) {
				throw fail(path, `extra property ${key} found`)
			}
		}
		return result
	}

	type.inner = inner

	return type
}


export const record = <K extends Type<string>, T extends Type<Json>>(key: K, value: T): Type<{ readonly [P in ReturnType<K>]: ReturnType<T> }> => {
	const type = (input: unknown, path: PropertyKey[] = []): { readonly [P in ReturnType<K>]: ReturnType<T> } => {
		if (input === null || typeof input !== 'object') {
			throw ParseError.format(input, path, 'object')
		}
		return Object.fromEntries(
			Object.entries(input as any).map(([k, v]) => {
				const newPath = [...path, k]
				return [key(k, newPath), value(v, newPath)]
			}),
		) as any
	}

	type.inner = { key, value }

	return type
}


export const union = <T extends Type<Json>[]>(...inner: T): Type<ReturnType<Unpacked<T>>> => {
	const type = (input: unknown, path: PropertyKey[] = []): ReturnType<Unpacked<T>> => {
		const errors = []
		for (const innerInner of inner) {
			try {
				return innerInner(input, path) as any
			} catch (e) {
				if (e instanceof ParseError) {
					errors.push(' '.repeat('ParseError: '.length) + e.message)
				} else {
					throw e
				}
			}
		}
		throw new ParseError(path, 'all variants of union has failed:\n' + errors.join('\n'))
	}

	type.inner = inner

	return type
}

export const partiallyDiscriminatedUnion = <T extends Type<JsonObject>[]>(field: string, ...inner: T): Type<ReturnType<Unpacked<T>>> => {
	const type = (input: unknown, path: PropertyKey[] = []): ReturnType<Unpacked<T>> => {
		const errors = []
		for (const innerInner of inner) {
			try {
				return innerInner(input, path) as any
			} catch (e) {
				if (e instanceof ParseError) {
					if (isDeepStrictEqual(e.path, [...path, field])) {
						continue
					}
					errors.push(' '.repeat('ParseError: '.length) + e.message)
				} else {
					throw e
				}
			}
		}
		throw new ParseError(path, 'all variants of union has failed:\n' + errors.join('\n'))
	}

	type.inner = inner

	return type
}

export const discriminatedUnion = <F extends string, T extends {[key: string]: JsonObject}>(field: F, inner: {[K in keyof T]: Type<T[K]>}): Type<{ [K in keyof T]: { [X in F]: K } & T[K] }[keyof T]> => {
	const type = (input: unknown, path: PropertyKey[] = []): { [K in keyof T]: { [X in F]: K } & T[K] }[keyof T] => {
		if (input === null || typeof input !== 'object') throw ParseError.format(input, path, 'object')
		const key = (input as any)[field]
		if (typeof key !== 'string') throw ParseError.format(key, [...path, field], 'string')

		const discriminatedType = inner[key]
		if (discriminatedType === undefined) throw ParseError.format(key, [...path, field], Object.keys(inner).join('|'))

		const { [field]: _, ...inputWithoutDiscr } = input

		return { [field]: key, ...discriminatedType(inputWithoutDiscr) }

	}
	type.inner = inner

	return type
}

type TupleFromTupledType<T extends Type<Json>[]> = T extends [Type<infer X>, ...infer Y]
	? (Y extends Type<Json>[] ? readonly [X, ...TupleFromTupledType<Y>] : readonly [])
	: readonly []

export const tuple = <T extends Type<Json>[]>(...inner: T): Type<TupleFromTupledType<T>> => {
	const type = (input: unknown, path: PropertyKey[] = []): TupleFromTupledType<T> => {
		if (!Array.isArray(input)) throw ParseError.format(input, path, 'array')
		if (input.length !== inner.length) throw ParseError.format(input, path, `array with length ${inner.length}`)
		return Object.entries(inner).map(([k, v]) => {
			const newPath = [...path, k]
			if (!(k in input)) {
				throw ParseError.format(undefined, newPath, 'defined')
			}
			return v(input[k as unknown as number], newPath)
		}) as any
	}

	type.inner = inner

	return type
}

type DiscriminatedTupleUnionType<T extends Record<string, Type<Json>[]>> =
	{ [K in keyof T]: (readonly [K, ...TupleFromTupledType<T[K]>]) }[keyof T & string]

export const discriminatedTupleUnion = <T extends Record<string, Type<Json>[]>>(inner: T): Type<DiscriminatedTupleUnionType<T>> => {
	const type = (input: unknown, path: PropertyKey[] = []): DiscriminatedTupleUnionType<T> => {
		if (!Array.isArray(input)) throw ParseError.format(input, path, 'array')
		if (input.length === 0) throw ParseError.format(input, path, `non-empty array`)

		const tupleType = inner[input[0]]
		if (tupleType === undefined) throw ParseError.format(input, [...path, 0], `one of ${Object.keys(inner).join(', ')}`)
		if (input.length !== tupleType.length + 1) throw ParseError.format(input, path, `array with length ${tupleType.length + 1}`)

		for (let i = 0; i < tupleType.length; i++) {
			tupleType[i](input[i + 1], [...path, i + 1])
		}

		return input as any
	}

	type.inner = inner

	return type
}

export const intersection = <T1 extends JsonObject, T2 extends JsonObject>(inner1: Type<T1>, inner2: Type<T2>): Type<T1 & T2> => {
	const type = (input: unknown, path: PropertyKey[] = []): T1 & T2 => {
		return {
			...inner1(input, path),
			...inner2(input, path),
		}
	}

	type.inner = [inner1, inner2]

	return type
}

export const enumeration = <T extends string>(...values: T[]): Type<T> => {
	const type = (input: unknown, path: PropertyKey[] = []): T => {
		if (typeof input !== 'string' || !values.includes(input as T)) throw ParseError.format(input, path, values.join('|'))
		return input as T
	}
	type.inner = values
	return type
}

export const null_ = literal(null)
export const true_ = literal(true)
export const false_ = literal(false)

export const nullable = <T extends Json>(inner: Type<T>): Type<T | null> => {
	const type = (input: unknown, path: PropertyKey[] = []) => {
		return input === null ? input : inner(input, path)
	}

	type.inner = inner
	return type
}

export const transform = <Input extends Json, Result extends Json>(inner: Type<Input>, transform: (value: Input, input: unknown) => Result) => (input: unknown, path: PropertyKey[] = []): Result => {
	return transform(inner(input, path), input)
}

export const coalesce = <T extends Json, F extends Json>(inner: Type<T>, fallback: F): Type<T | F> => {
	const type = (input: unknown, path: PropertyKey[] = []): T | F => {
		try {
			return inner(input, path)
		} catch (e) {
			if (e instanceof ParseError) return fallback
			else throw e
		}
	}

	type.inner = inner

	return type
}

export const valueAt = (input: any, path: PropertyKey[]): unknown | undefined => {
	let value = input
	for (const key of path) {
		if (typeof value !== 'object' || value === null) {
			return undefined
		}
		value = (value as any)[key]
	}
	return value
}

type EqualsWrapped<T> = T extends infer R & {}
	? {
		[P in keyof R]: R[P]
	}
	: never

export type Equals<A, B> = (<T>() => T extends EqualsWrapped<A> ? 1 : 2) extends <T>() => T extends EqualsWrapped<B> ? 1 : 2
	? true
	: false
