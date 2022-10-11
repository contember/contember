import { QueryConfig, QueryResult, QueryResultRow } from 'pg'
import { EventEmitter } from 'events'

export interface PgClient extends EventEmitter {
	connect(): Promise<void>

	query<R extends QueryResultRow = any, I extends any[] = any[]>(
		queryTextOrConfig: string | QueryConfig<I>,
		values?: I,
	): Promise<QueryResult<R>>

	end(): Promise<void>
}
