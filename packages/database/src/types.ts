export type JSONPrimitive = string | number | boolean | null | undefined
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

export type Value =
	| JSONValue
	| Date
	| readonly Date[]
	| Buffer


export interface Raw {
	sql: string
	bindings: Value[]
}

export interface DatabaseConfig {
	readonly host: string
	readonly port: number
	readonly user: string
	readonly password: string
	readonly database: string
	readonly ssl?: boolean
	readonly queryTimeoutMs?: number
	readonly statementTimeoutMs?: number
	readonly connectionTimeoutMs?: number
}
