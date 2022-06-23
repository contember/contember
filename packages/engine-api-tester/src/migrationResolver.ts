import { Migration, MigrationsResolver } from '@contember/schema-migrations'
import { createMock } from './utils.js'

export const createMigrationResolver = (migrations: Migration[]): MigrationsResolver =>
	createMock<MigrationsResolver>({
		get directory(): string {
			return 'dummy'
		},
		getMigrations(): Promise<Migration[]> {
			return Promise.resolve(migrations)
		},
	})
