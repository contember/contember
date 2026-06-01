import pg from 'pg'
import { DatabaseConfig } from '../types'
import { PgClient } from '../client/PgClient'

export type PgClientFactory = () => PgClient
export const createPgClientFactory = ({ queryTimeoutMs, statementTimeoutMs, lockTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => {
	return new pg.Client({
		query_timeout: queryTimeoutMs,
		statement_timeout: statementTimeoutMs,
		lock_timeout: lockTimeoutMs,
		connectionTimeoutMillis: connectionTimeoutMs,
		...config,
	})
}
