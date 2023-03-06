import { Connection } from '@contember/database'
import { MigrationsResolver } from './MigrationsResolver'

export class MigrationsRunner<MigrationArgs> {
	constructor(
		private readonly connection: Connection.ConnectionLike,
		private readonly schema: string,
		private readonly migrationsResolver: MigrationsResolver<MigrationArgs>,
	) {}

	public async migrate(
		log: (msg: string) => void,
		migrationArgs: MigrationArgs,
	): Promise<{ name: string }[]> {
		const migrate = (await import('./runner')).default
		return await migrate(this.migrationsResolver, this.connection, {
			schema: this.schema,
			migrationsTable: 'migrations',
			migrationArgs,
			log,
		})
	}
}
