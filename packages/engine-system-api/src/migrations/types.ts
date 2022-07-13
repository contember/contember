import { Schema } from '@contember/schema'
import { ProjectConfig } from '../types'
import { Connection } from '@contember/database'

export interface SystemMigrationArgs {
	schemaResolver: (connection: Connection.ConnectionLike) => Promise<Schema>
	project: ProjectConfig
}
