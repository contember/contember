import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { ExecutedMigration } from '../dtos/ExecutedMigration'
import { createExecutedMigrationDto, createExecutedMigrationQueryBuilder } from './ExecutedMigrationsQueryHelper'

export class ExecutedMigrationByVersionQuery extends DatabaseQuery<ExecutedMigration | null> {
	constructor(private version: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ExecutedMigration | null> {
		const builder = createExecutedMigrationQueryBuilder().where({ version: this.version })
		const rows = await builder.getResult(queryable.db)
		const migration = await this.fetchOneOrNull(rows)
		return migration ? createExecutedMigrationDto(migration) : null
	}
}
