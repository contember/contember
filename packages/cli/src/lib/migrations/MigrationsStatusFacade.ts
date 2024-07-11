import { MigrationsResolver, MigrationsStatusResolver, SystemClient } from '@contember/migrations-client'
import { createMigrationStatusTable } from './migrations'
import { SystemClientProvider } from '../SystemClientProvider'

export class MigrationsStatusFacade {
	constructor(
		private readonly systemClientProvider: SystemClientProvider,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationsStatusResolver: MigrationsStatusResolver,
	) {
	}


	public resolveMigrationsStatus = async ({ force }: { force?: boolean }) => {
		const executedMigrations = await this.systemClientProvider.get().listExecutedMigrations()
		const localMigrations = await this.migrationsResolver.getMigrationFiles()
		const status = await this.migrationsStatusResolver.getMigrationsStatus(executedMigrations, localMigrations, force)
		if (status.errorMigrations.length > 0) {
			console.error(createMigrationStatusTable(status.errorMigrations))
			if (!force) {
				throw `Cannot execute migrations`
			}
		}

		return status
	}
}
