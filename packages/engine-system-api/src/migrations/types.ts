import { Schema } from '@contember/schema'
import { ProjectConfig } from '../types'
import { Connection, DatabaseMetadata } from '@contember/database'

export interface SystemMigrationArgs {
	schemaResolver: (connection: Connection.ConnectionLike) => Promise<Schema>
	databaseMetadataResolver: (connection: Connection.ConnectionLike, schema: string) => Promise<DatabaseMetadata>
	project: ProjectConfig
}
