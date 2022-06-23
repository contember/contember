import { ExecutedMigration } from '../dtos/index.js'
import { ExecutedMigrationByVersionQuery, ExecutedMigrationsQuery } from '../queries/index.js'
import { DatabaseContext } from '../database/index.js'

export class ExecutedMigrationsResolver {
	async getMigrations(db: DatabaseContext, afterVersion?: string): Promise<ExecutedMigration[]> {
		return db.queryHandler.fetch(new ExecutedMigrationsQuery(afterVersion))
	}

	async getMigrationByVersion(db: DatabaseContext, version: string): Promise<ExecutedMigration | null> {
		return db.queryHandler.fetch(new ExecutedMigrationByVersionQuery(version))
	}
}
