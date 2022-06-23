import pg from 'pg'
import { DatabaseConfig } from '../types'

export type PgClientFactory = () => pg.Client
export const createPgClientFactory = ({ queryTimeoutMs, statementTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => new pg.Client({
	query_timeout: queryTimeoutMs,
	statement_timeout: statementTimeoutMs,
	connectionTimeoutMillis: connectionTimeoutMs,
	...config,
})
