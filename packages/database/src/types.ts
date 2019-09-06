export type Value =
	| null
	| string
	| number
	| boolean
	| Date
	| readonly string[]
	| readonly number[]
	| readonly Date[]
	| readonly boolean[]
	| Buffer

export interface Raw {
	sql: string
	bindings: Value[]
}
