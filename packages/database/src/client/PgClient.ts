import { Notification, QueryConfig, QueryResult, QueryResultRow } from 'pg'

export interface PgClient {
	connect(): Promise<void>

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
