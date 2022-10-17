import { SelectBuilder } from '@contember/database'
import { ExecutedMigration } from '../../dtos'
import { VERSION_INITIAL } from '@contember/schema-migrations'

type ExecutedMigrationRow = { id: number; name: string; migration: any; checksum: string; executed_at: Date }
export const createExecutedMigrationQueryBuilder = () =>
	SelectBuilder.create<ExecutedMigrationRow>()
		.select('id')
		.select('name')
		.select('migration')
		.select('checksum')
		.select('executed_at')
		.from('schema_migration')
		.orderBy('version')

export const createExecutedMigrationDto = (row: ExecutedMigrationRow) =>
	new ExecutedMigration(
		row.id,
		row.name,
		row.migration.formatVersion || VERSION_INITIAL,
		row.migration.modifications,
		row.executed_at,
		row.checksum,
	)
