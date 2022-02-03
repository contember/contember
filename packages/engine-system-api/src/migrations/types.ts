import { Schema } from '@contember/schema'
import { ProjectConfig } from '../types'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'

export interface SystemMigrationArgs {
	schemaResolver: () => Promise<Schema>
	project: ProjectConfig
	queryHandler: QueryHandler<DatabaseQueryable>
}
