import { InsertBuilder, QueryBuilder } from '@contember/database'
import { calculateMigrationChecksum, Migration } from '@contember/schema-migrations'
import { Command } from './Command'

export class SaveMigrationCommand implements Command<void> {
	constructor(private readonly migration: Migration, private readonly executedAt?: Date) {}

	public async execute({ db }: Command.Args): Promise<void> {
		const values: QueryBuilder.Values = {
			version: this.migration.version,
			name: this.migration.name,
			migration: JSON.stringify(this.migration),
			checksum: calculateMigrationChecksum(this.migration),
		}
		if (this.executedAt) {
			values.executed_at = this.executedAt
		}
		await InsertBuilder.create()
			.into('schema_migration')
			.values(values)
			.execute(db)
	}
}
