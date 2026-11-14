import pg from 'pg'
import { DatabaseConfig } from '../types.js'
import { PgClient } from '../client/PgClient.js'

export type PgClientFactory = () => PgClient
export const createPgClientFactory =
	({ queryTimeoutMs, statementTimeoutMs, lockTimeoutMs, connectionTimeoutMs, ...config }: DatabaseConfig) => () => {
		const { keepAlive, keepAliveInitialDelayMs, ...connectionConfig } = config
		const clientConfig: pg.ClientConfig = {
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
