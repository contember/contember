export namespace QueryBuilder {
	export interface Object {
		[key: string]: Value
	}

	export interface List extends Array<Value> {}

	export type AtomicValue = string | null | number | boolean
	export type Value = AtomicValue | Object | List
}
