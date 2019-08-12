export type Value =
	| null
	| string
	| number
	| boolean
	| Date
	| ReadonlyArray<string>
	| ReadonlyArray<number>
	| ReadonlyArray<Date>
	| ReadonlyArray<boolean>
	| Buffer

export interface Raw {
	sql: string
	bindings: Value[]
}
