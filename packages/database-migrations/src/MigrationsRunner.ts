import { DatabaseCredentials, Connection, wrapIdentifier } from '@contember/database'
import migrate from './runner'
import { ClientBase } from 'pg'
import { RunnerOptionClient, RunnerOptionUrl } from 'node-pg-migrate/dist/types'

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
		await migrate({
			...dbParams,
			dir: this.dir,
			schema: this.schema,
			migrationsTable: 'migrations',
			ignorePattern: '(\\..*)|(.+\\.ts)|tsconfig\\..+|.+\\.map',
			createSchema: true,
			migrationArgs,
			log: (msg: string) => {
				log && console.log(msg)
			},
		})
	}

	private async createDatabaseIfNotExists() {
		const connection = new Connection({ ...this.db, database: 'postgres' }, {})
		const result = await connection.query('SELECT 1 FROM "pg_database" WHERE "datname" = ?', [this.db.database])

		if (result.rowCount === 0) {
			console.warn(`Database ${this.db.database} does not exist, attempting to create it...`)
			await connection.query(`CREATE DATABASE ${wrapIdentifier(this.db.database)}`)
		}

		await connection.end()
	}
}
