import { Client as PgClient } from 'pg'
import { DatabaseConfig } from '../types'

export type PgClientFactory = () => PgClient
export const createPgClientFactory = ({ queryTimeoutMs, statementTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => new PgClient({
	query_timeout: queryTimeoutMs,
	statement_timeout: statementTimeoutMs,
	connectionTimeoutMillis: connectionTimeoutMs,
	...config,
})
