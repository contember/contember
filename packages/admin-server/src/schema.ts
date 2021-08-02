type Unpacked<T> = T extends readonly (infer U)[] ? U : never

export type Json =
	| string
	| number
	| boolean
	| null
	| readonly Json[]
	| { readonly [property: string]: Json | undefined }

export interface Type<T extends Json> {
	(input: unknown, path?: PropertyKey[]): T
	readonly inner?: any
}

export class ParseError extends Error {
	constructor(readonly input: unknown, readonly path: PropertyKey[], readonly expected: string) {
		super(`${path.join('/')} must be ${expected}, ${typeof input} given`)
	}
}

export const string = (() => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'string') throw new ParseError(input, path, 'string')
		return input
	}
})()

export const number = (() => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'number') throw new ParseError(input, path, 'number')
		return input
	}
})()

export const boolean = (() => {
	return (input: unknown, path: PropertyKey[] = []) => {
		if (typeof input !== 'boolean') throw new ParseError(input, path, 'boolean')
		return input
	}
})()

export const literal = <T extends Json>(inner: T) => {
	const type = (input: unknown, path: PropertyKey[] = []): T => {
		if (input !== inner) throw new ParseError(input, path, JSON.stringify(inner))
		return inner
	}

	type.inner = inner

	return type
}

export const array = <T extends Json>(inner: Type<T>) => {
	const type = (input: unknown, path: PropertyKey[] = []): readonly T[] => {
		if (!Array.isArray(input)) throw new ParseError(input, path, 'array')
		return input.map((v, i) => inner(v, [...path, i]))
	}

	type.inner = type

	return type
}

export const object = <T extends Record<string, Type<Json>>>(inner: T) => {
	const type = (input: unknown, path: PropertyKey[] = []): { readonly [P in keyof T]: ReturnType<T[P]> } => {
		if (input === null || typeof input !== 'object') throw new ParseError(input, path, 'object')
		return Object.fromEntries(Object.entries(inner).map(([k, v]) => [k, v((input as any)[k], [...path, k])])) as any
	}

	type.inner = inner

	return type
}

export const union = <T extends Type<Json>[]>(...inner: T) => {
	const type = (input: unknown, path: PropertyKey[] = []): ReturnType<Unpacked<T>> => {
		const expected = []
		for (const innerInner of inner) {
			try {
				return innerInner(input, path) as any
			} catch (e) {
				if (e instanceof ParseError) expected.push(e.expected)
				else throw e
			}
		}
		throw new ParseError(input, path, expected.join('|'))
	}

	type.inner = inner

	return type
}

export const null_ = literal(null)
export const true_ = literal(true)
export const false_ = literal(false)

export const nullable = <T extends Json>(inner: Type<T>) => {
	return union(null_, inner)
}

export const coalesce = <T extends Json, F extends Json>(inner: Type<T>, fallback: F) => {
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
