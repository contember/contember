import { DatabaseCredentials } from '../../config/config'
import pgMigrate from 'node-pg-migrate'

export default class MigrationsRunner {
	constructor(
		private readonly db: DatabaseCredentials,
		private readonly schema: string,
		private readonly dir: string,
	) {}

	public async migrate(log: boolean = true) {
		await pgMigrate({
			databaseUrl: this.db,
			dir: this.dir,
			schema: this.schema,
			migrationsTable: 'migrations',
			checkOrder: true,
			direction: 'up',
			count: Infinity,
			ignorePattern: '^\\..*$',
			createSchema: true,
			singleTransaction: true,
			log: (msg: string) => {
				log && console.log('    ' + msg.replace(/\n/g, '\n    '))
			},
		})
	}
}
