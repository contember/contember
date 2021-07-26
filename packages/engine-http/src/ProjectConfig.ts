import { DatabaseCredentials } from '@contember/database'

export type ProjectConfig = {
	readonly slug: string
	readonly alias?: string[]
	readonly name: string
	readonly stages: StageConfig[]
	readonly db: DatabaseCredentials
} & Record<string, unknown>

export interface StageConfig {
	readonly slug: string
	readonly name: string
	readonly base?: string
}

export type ProjectConfigResolver = (slug: string, additionalConfig: any) => ProjectConfig
