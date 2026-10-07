import { Notification, QueryConfig, QueryResult, QueryResultRow, Submittable } from 'pg'

declare module 'pg' {
	interface Client {
		// Set by pg from the server's BackendKeyData message once connected; missing from @types/pg.
		readonly processID: number | null
		readonly secretKey: number | null
	}
}

export interface PgClient {
	readonly host: string
	readonly port: number
	readonly processID: number | null
	readonly secretKey: number | null

	connect(): Promise<void>

	query<T extends Submittable>(query: T): T

	query<R extends QueryResultRow = any, I extends any[] = any[]>(
		queryTextOrConfig: string | QueryConfig<I>,
		values?: I,
	): Promise<QueryResult<R>>

	end(): Promise<void>

	on(event: 'notification', listener: (message: Notification) => void): this
	on(event: 'error', listener: (err: Error) => void): this
	on(event: 'end', listener: () => void): this

	off(eventName: string | symbol, listener: (...args: any[]) => void): this
}
