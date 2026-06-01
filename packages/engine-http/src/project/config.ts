import { DatabaseConfig, PoolConfig } from '@contember/database'

export type ProjectConfig = {
	readonly slug: string
	readonly alias?: string[]
	readonly name: string
	readonly stages: StageConfig[]
	readonly db:
		& DatabaseConfig
		& {
			pool?: Omit<PoolConfig, 'logError'>
			systemSchema?: string
			/**
			 * Maximum number of database connections a single HTTP request may hold
			 * concurrently. Prevents one request from starving the shared pool. Defaults
			 * to unlimited (no per-request cap). Must be at least 1.
			 */
			maxConnectionsPerRequest?: number
			read?:
				& Partial<DatabaseConfig>
				& {
					pool?: Omit<PoolConfig, 'logError'>
				}
		}
} & Record<string, unknown>

export interface StageConfig {
	readonly slug: string
	readonly name: string
}

export type ProjectSecrets = Record<string, string>
