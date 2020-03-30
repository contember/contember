import { Client, InsertBuilder } from '@contember/database'
import { Migration } from '@contember/schema-migrations'
import { calculateMigrationChecksum } from '@contember/schema-migrations'

export class SaveMigrationCommand {
	constructor(private readonly migration: Migration) {}

	public async execute(db: Client): Promise<void> {
		await InsertBuilder.create()
			.into('schema_migration')
			.values({
				version: this.migration.version,
				name: this.migration.name,
				migration: JSON.stringify(this.migration),
				checksum: calculateMigrationChecksum(this.migration),
			})
			.execute(db)
	}
}
