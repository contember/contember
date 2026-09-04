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
	readonly lockTimeoutMs?: number
	readonly connectionTimeoutMs?: number
	/**
	 * Enable TCP keep-alive on the connection socket (`pg`'s `keepAlive`).
	 * When a pooled connection is idle and the peer (a connection pooler, load
	 * balancer or NAT) silently drops it, the socket only surfaces as broken on
	 * the next use. With keep-alive the OS probes idle connections, so a dead one
	 * errors out and is discarded by the pool instead of being handed to a query.
	 * Defaults to `false` (pg default).
	 */
	readonly keepAlive?: boolean
	/**
	 * Idle time before the first TCP keep-alive probe, in milliseconds
	 * (`pg`'s `keepAliveInitialDelayMillis`). Only applies when `keepAlive` is
	 * enabled; the subsequent probe interval and count are controlled by the OS.
	 */
	readonly keepAliveInitialDelayMs?: number
}
