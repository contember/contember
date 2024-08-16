import pg from 'pg'
import { DatabaseConfig } from '../types'
import { PgClient } from '../client/PgClient'

export type PgClientFactory = () => PgClient
export const createPgClientFactory = ({ queryTimeoutMs, statementTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => {
	return new pg.Client({
		query_timeout: queryTimeoutMs,
		statement_timeout: statementTimeoutMs,
		connectionTimeoutMillis: connectionTimeoutMs,
		...config,
	})
}
