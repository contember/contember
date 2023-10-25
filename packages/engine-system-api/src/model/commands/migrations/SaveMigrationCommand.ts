import { InsertBuilder, QueryBuilder } from '@contember/database'
import { calculateMigrationChecksum } from '@contember/schema-migrations'
import { Command } from '../Command'
import { MigrationInput } from '../../migrations/MigrationInput'

export class SaveMigrationCommand implements Command<number> {
	constructor(private readonly migration: MigrationInput) {}

	public async execute({ db }: Command.Args): Promise<number> {
		const { type, ...migrationData } = this.migration

		if ('queries' in migrationData) {
			// in case of content migration, we don't want to store the queries
			migrationData.queries = []
		}

		const values: QueryBuilder.Values = {
			version: this.migration.version,
			name: this.migration.name,
			type,
			migration: JSON.stringify(migrationData),
			checksum: this.migration.type === 'schema' ? calculateMigrationChecksum(this.migration) : null,
		}

		const result = await InsertBuilder.create()
			.into('schema_migration')
			.values(values)
			.returning<{id: number}>('id')
			.execute(db)

		return result[0].id
	}
}
