import { ExecutedMigration } from '../dtos'
import { ExecutedMigrationByVersionQuery, ExecutedMigrationsQuery } from '../queries'
import { DatabaseContext } from '../database'

export class ExecutedMigrationsResolver {
	async getMigrations(db: DatabaseContext, afterVersion?: string): Promise<ExecutedMigration[]> {
		return db.queryHandler.fetch(new ExecutedMigrationsQuery(afterVersion))
	}

	async getMigrationByVersion(db: DatabaseContext, version: string): Promise<ExecutedMigration | null> {
		return db.queryHandler.fetch(new ExecutedMigrationByVersionQuery(version))
	}
}
