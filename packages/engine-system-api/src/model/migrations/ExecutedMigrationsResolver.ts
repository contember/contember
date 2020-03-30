import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { ExecutedMigration } from '../dtos/ExecutedMigration'
import { ExecutedMigrationsQuery } from '../queries/ExecutedMigrationsQuery'
import { ExecutedMigrationByVersionQuery } from '../queries/ExecutedMigrationByVersionQuery'

export class ExecutedMigrationsResolver {
	constructor(private readonly queryHandler: QueryHandler<DatabaseQueryable>) {}

	async getMigrations(afterVersion?: string): Promise<ExecutedMigration[]> {
		return this.queryHandler.fetch(new ExecutedMigrationsQuery(afterVersion))
	}

	async getMigrationByVersion(version: string): Promise<ExecutedMigration | null> {
		return this.queryHandler.fetch(new ExecutedMigrationByVersionQuery(version))
	}
}
