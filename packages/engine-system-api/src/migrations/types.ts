import { Schema } from '@contember/schema'
import { ProjectConfig } from '../types'
import { Connection } from '@contember/database'
import { SchemaDatabaseMetadata } from '@contember/schema-utils'

export interface SystemMigrationArgs {
	schemaResolver: (connection: Connection.ConnectionLike) => Promise<Schema>
	databaseMetadataResolver: (connection: Connection.ConnectionLike, schema: string) => Promise<SchemaDatabaseMetadata>
	project: ProjectConfig
}
