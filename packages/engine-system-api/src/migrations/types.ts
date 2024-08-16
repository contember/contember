import { ProjectConfig } from '../types'
import { Connection, DatabaseMetadata } from '@contember/database'
import { SchemaWithMeta } from '../model'

export interface SystemMigrationArgs {
	schemaResolver: (connection: Connection.ConnectionLike) => Promise<SchemaWithMeta>
	databaseMetadataResolver: (connection: Connection.ConnectionLike, schema: string) => Promise<DatabaseMetadata>
	project: ProjectConfig
}
