import { ExecutedMigration } from '../dtos/ExecutedMigration'
import { ExecutedMigrationsQuery } from '../queries/ExecutedMigrationsQuery'
import { ExecutedMigrationByVersionQuery } from '../queries/ExecutedMigrationByVersionQuery'
import { DatabaseContext } from '../database/DatabaseContext'

export class ExecutedMigrationsResolver {
	async getMigrations(db: DatabaseContext, afterVersion?: string): Promise<ExecutedMigration[]> {
		return db.queryHandler.fetch(new ExecutedMigrationsQuery(afterVersion))
	}

	async getMigrationByVersion(db: DatabaseContext, version: string): Promise<ExecutedMigration | null> {
		return db.queryHandler.fetch(new ExecutedMigrationByVersionQuery(version))
	}
}
