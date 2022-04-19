import { DatabaseConfig, PoolConfig } from '@contember/database'

export type ProjectConfig = {
	readonly slug: string
	readonly alias?: string[]
	readonly name: string
	readonly stages: StageConfig[]
	readonly db:
		& DatabaseConfig
		& {
			pool?: PoolConfig
			systemSchema?: string
		}
} & Record<string, unknown>

export interface StageConfig {
	readonly slug: string
	readonly name: string
}

export type ProjectSecrets = Record<string, string>

