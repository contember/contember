import { InsertBuilder, Literal, QueryBuilder, SelectBuilder } from '@contember/database'
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

		const latestId = (await SelectBuilder.create<{ id: number }>()
			.from('schema_migration')
			.select(new Literal('max(id)'), 'id')
			.getResult(db)
		)[0]?.id ?? 0

		const newId = latestId + 1
		const result = await InsertBuilder.create()
			.into('schema_migration')
			.values({ id: newId, ...values })
			.execute(db)

		return newId
	}
}
