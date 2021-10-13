import { DatabaseCredentials } from '@contember/database'
import { ClientBase } from 'pg'
import { RunnerOptionClient, RunnerOptionUrl } from 'node-pg-migrate/dist/types'
import { createDatabaseIfNotExists } from './helpers'
import { Migration } from './runner'

export class MigrationsRunner<MigrationArgs> {
	constructor(
		private readonly db: DatabaseCredentials,
		private readonly schema: string,
		private readonly migrations: () => Promise<Migration[]>,
		private readonly dbClient?: ClientBase,
	) {}

	public async migrate(
		log: (msg: string) => void,
		migrationArgs?: MigrationArgs,
	): Promise<{ name: string }[]> {
		await this.createDatabaseIfNotExists(log)
		const dbParams: RunnerOptionClient | RunnerOptionUrl = this.dbClient
			? { dbClient: this.dbClient }
			: { databaseUrl: this.db }
		const migrate = (await import('./runner')).default
		return await migrate(this.migrations, {
			...dbParams,
			schema: this.schema,
			migrationsTable: 'migrations',
			createSchema: true,
			migrationArgs,
			log,
		})
	}

	private async createDatabaseIfNotExists(log: (msg: string) => void) {
		await createDatabaseIfNotExists(this.db, log)
	}
}
