import pg from 'pg'
import { DatabaseConfig } from '../types.js'
import { PgClient } from '../client/PgClient.js'

export type PgClientFactory = () => PgClient
export const createPgClientFactory =
	({ queryTimeoutMs, statementTimeoutMs, lockTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => {
		// `lock_timeout` is supported by pg at runtime but missing from the installed @types/pg version,
		// so it is typed explicitly here.
		const { keepAlive, keepAliveInitialDelayMs, ...connectionConfig } = config
		const clientConfig: pg.ClientConfig & { lock_timeout?: number } = {
			query_timeout: queryTimeoutMs,
			statement_timeout: statementTimeoutMs,
			lock_timeout: lockTimeoutMs,
			connectionTimeoutMillis: connectionTimeoutMs,
			keepAlive: keepAlive ?? false,
			keepAliveInitialDelayMillis: keepAliveInitialDelayMs,
			...connectionConfig,
		}
		return new pg.Client(clientConfig)
	}
