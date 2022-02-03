import { Connection } from '@contember/database'
import { Migration } from './Migration'

export class MigrationsRunner<MigrationArgs> {
	constructor(
		private readonly connection: Connection.ConnectionLike,
		private readonly schema: string,
		private readonly migrations: () => Promise<Migration[]>,
	) {}

	public async migrate(
		log: (msg: string) => void,
		migrationArgs?: MigrationArgs,
	): Promise<{ name: string }[]> {
		const migrate = (await import('./runner')).default
		return await migrate(this.migrations, this.connection, {
			schema: this.schema,
			migrationsTable: 'migrations',
			migrationArgs,
			log,
		})
	}
}
