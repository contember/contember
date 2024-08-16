import { GraphQlLiteral } from '../graphQlBuilder'

export type ReplaceGraphQlLiteral<T> = T extends GraphQlLiteral<infer Value>
	? Value
	: T extends string | number | boolean | null
		? T // Keep primitives as is
		: T extends {}
			? { [K in keyof T]: ReplaceGraphQlLiteral<T[K]> } // Recursively apply to objects
			: T extends any[]
				? ReplaceGraphQlLiteral<T[number]>[] // Recursively apply to array elements
				: T

export const replaceGraphQlLiteral = <T>(input: T): ReplaceGraphQlLiteral<T> => {
	if (input instanceof GraphQlLiteral) {
		return input.value as any
	} else if (Array.isArray(input)) {
		return input.map(replaceGraphQlLiteral) as any
	} else if (typeof input === 'object' && input !== null) {
		return Object.fromEntries(Object.entries(input).map(([key, value]) => value !== undefined ? [key, replaceGraphQlLiteral(value)] : undefined).filter(Boolean) as any) as any
	}
	return input as any
}
