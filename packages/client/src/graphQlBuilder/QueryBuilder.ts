import type { GraphQlLiteral } from './GraphQlLiteral'


export namespace QueryBuilder {
	export interface Object {
		[key: string]: Value
	}

	export interface List extends Array<Value> {}

	export type AtomicValue = string | null | number | boolean | GraphQlLiteral
	export type Value = AtomicValue | Object | List
}
