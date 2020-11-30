import { DatabaseCredentials } from '@contember/database'
import { ClientBase } from 'pg'
import { RunnerOptionClient, RunnerOptionUrl } from 'node-pg-migrate/dist/types'
import { createDatabaseIfNotExists } from './helpers'

export class MigrationsRunner {
	constructor(
		private readonly db: DatabaseCredentials,
		private readonly schema: string,
		private readonly dir: string,
		private readonly dbClient?: ClientBase,
	) {}

	public async migrate<MigrationArgs>(
		log: (msg: string) => void,
		migrationArgs?: MigrationArgs,
	): Promise<{ name: string }[]> {
		await this.createDatabaseIfNotExists(log)
		const dbParams: RunnerOptionClient | RunnerOptionUrl = this.dbClient
			? { dbClient: this.dbClient }
			: { databaseUrl: this.db }
		const migrate = (await import('./runner')).default
		return await migrate({
			...dbParams,
			dir: this.dir,
			schema: this.schema,
			migrationsTable: 'migrations',
			ignorePattern: '(\\..*)|(.+\\.ts)|tsconfig\\..+|.+\\.map|.+\\.test\\.js',
			createSchema: true,
			migrationArgs,
			log,
		})
	}

	private async createDatabaseIfNotExists(log: (msg: string) => void) {
		await createDatabaseIfNotExists(this.db, log)
	}
}
