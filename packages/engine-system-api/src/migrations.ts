import { Schema } from '@contember/schema'
import { ProjectConfig } from './types'

export const systemMigrationsDirectory = __dirname + '/../../migrations'

export interface MigrationArgs {
	schemaResolver: () => Promise<Schema>
	project: ProjectConfig
}
