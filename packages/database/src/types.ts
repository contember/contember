export type JSONPrimitive = string | number | boolean | null | undefined
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export type Value =
	| JSONValue
	| Date
	| readonly Date[]
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
