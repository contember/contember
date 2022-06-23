import { MigrationBuilder } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types.js'

export default async function (builder: MigrationBuilder, args: SystemMigrationArgs) {
	builder.createTable(
		{
			name: 'schema_migration',
		},
		{
			id: { notNull: true, type: 'SERIAL4' },
			version: { notNull: true, type: 'varchar(20)', unique: true },
			name: { notNull: true, type: 'varchar(255)', unique: true },
			migration: { notNull: true, type: 'json' },
			checksum: { notNull: true, type: 'char(32)' },
			executed_at: { notNull: true, type: 'timestamp', default: 'now()' },
		},
	)
	builder.createIndex({ name: 'schema_migration' }, ['version'], {
		name: 'system_schema_migration_version',
	})
}
