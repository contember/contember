import { Migration, MigrationsResolver } from '@contember/schema-migrations'
import { createMock } from './utils'

export const createMigrationResolver = (migrations: Migration[]): MigrationsResolver =>
	createMock<MigrationsResolver>({
		getMigrations(): Promise<Migration[]> {
			return Promise.resolve(migrations)
		},
	})
