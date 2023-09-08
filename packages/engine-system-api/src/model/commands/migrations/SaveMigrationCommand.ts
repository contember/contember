import { InsertBuilder, QueryBuilder } from '@contember/database'
import { calculateMigrationChecksum } from '@contember/schema-migrations'
import { Command } from '../Command'
import { MigrationInput } from '../../migrations/MigrationInput'

export class SaveMigrationCommand implements Command<void> {
	constructor(private readonly migration: MigrationInput) {}

	public async execute({ db }: Command.Args): Promise<void> {
		const { type, ...migrationData } = this.migration
		const values: QueryBuilder.Values = {
			version: this.migration.version,
			name: this.migration.name,
			type,
			migration: JSON.stringify(migrationData),
			checksum: this.migration.type === 'schema' ? calculateMigrationChecksum(this.migration) : null,
		}

		await InsertBuilder.create()
			.into('schema_migration')
			.values(values)
			.execute(db)
	}
}
