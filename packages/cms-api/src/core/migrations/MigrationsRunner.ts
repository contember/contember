import { DatabaseCredentials } from '../../config/config'
import pgMigrate from 'node-pg-migrate'

export default class MigrationsRunner {
	public async migrate(db: DatabaseCredentials, schema: string, dir: string, log: boolean = true) {
		await pgMigrate({
			databaseUrl: db,
			dir: dir,
			schema: schema,
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
