import { QueryBuilder, UpdateBuilder } from '@contember/database'
import { calculateMigrationChecksum, Migration } from '@contember/schema-migrations'
import { Command } from '../Command.js'
import { ExecutedMigrationByVersionQuery } from '../../queries/index.js'

export class ModifyMigrationCommand implements Command<boolean> {
	constructor(private readonly version: string, private readonly migration: Partial<Migration>) {}

	public async execute({ db }: Command.Args): Promise<boolean> {
		const current = await db.createQueryHandler().fetch(new ExecutedMigrationByVersionQuery(this.version))
		if (!current) {
			return false
		}
		const newMigration = {
			version: current.version,
			name: current.name,
			formatVersion: current.formatVersion,
			modifications: current.modifications,
			...this.migration,
		}
		const values: QueryBuilder.Values = {
			version: newMigration.version,
			name: newMigration.name,
			migration: JSON.stringify(newMigration),
			checksum: calculateMigrationChecksum(newMigration),
		}
		await UpdateBuilder.create() //
			.table('schema_migration')
			.values(values)
			.where({
				version: this.version,
			})
			.execute(db)
		return true
	}
}
