export type Value =
	| null
	| string
	| number
	| boolean
	| Date
	| Array<string>
	| Array<number>
	| Array<Date>
	| Array<boolean>
	| Buffer

export interface Raw {
	sql: string
	bindings: Value[]
}
