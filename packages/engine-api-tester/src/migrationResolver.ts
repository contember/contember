import { Migration, MigrationsResolver } from '@contember/engine-system-api'
import { createMock } from './utils'

export const createMigrationResolver = (migrations: Migration[]): MigrationsResolver =>
	createMock<MigrationsResolver>({
		getMigrations(): Promise<Migration[]> {
			return Promise.resolve(migrations)
		},
	})
