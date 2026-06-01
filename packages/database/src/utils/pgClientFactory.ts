import pg from 'pg'
import { DatabaseConfig } from '../types'
import { PgClient } from '../client/PgClient'

export type PgClientFactory = () => PgClient
export const createPgClientFactory =
	({ queryTimeoutMs, statementTimeoutMs, lockTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => {
		// `lock_timeout` is supported by pg at runtime but missing from the installed @types/pg version,
		// so it is typed explicitly here.
		const clientConfig: pg.ClientConfig & { lock_timeout?: number } = {
			query_timeout: queryTimeoutMs,
			statement_timeout: statementTimeoutMs,
			lock_timeout: lockTimeoutMs,
			connectionTimeoutMillis: connectionTimeoutMs,
			...config,
		}
		return new pg.Client(clientConfig)
	}
