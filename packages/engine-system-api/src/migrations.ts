import { Schema } from '@contember/schema'
import { ProjectConfig } from './types'
import { MigrationsResolverFactory } from './model/migrations'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'

export const systemMigrationsDirectory = __dirname + '/../../migrations'

export interface MigrationArgs {
	schemaResolver: () => Promise<Schema>
	project: ProjectConfig
	queryHandler: QueryHandler<DatabaseQueryable>
	migrationsResolverFactory?: MigrationsResolverFactory
}
