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

	public async migrate<MigrationArgs>(log: boolean = true, migrationArgs?: MigrationArgs) {
		await this.createDatabaseIfNotExists()
		const dbParams: RunnerOptionClient | RunnerOptionUrl = this.dbClient
			? { dbClient: this.dbClient }
			: { databaseUrl: this.db }
		const migrate = (await import('./runner')).default
		await migrate({
			...dbParams,
			dir: this.dir,
			schema: this.schema,
			migrationsTable: 'migrations',
			ignorePattern: '(\\..*)|(.+\\.ts)|tsconfig\\..+|.+\\.map|.+\\.test\\.js',
			createSchema: true,
			migrationArgs,
			log: (msg: string) => {
				// eslint-disable-next-line no-console
				log && console.log(msg)
			},
		})
	}

	private async createDatabaseIfNotExists() {
		await createDatabaseIfNotExists(this.db)
	}
}
