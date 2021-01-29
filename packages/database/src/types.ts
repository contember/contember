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

export interface DatabaseCredentials {
	readonly host: string
	readonly port: number
	readonly user: string
	readonly password: string
	readonly database: string
	readonly ssl?: boolean
}
