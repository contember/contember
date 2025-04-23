import { MigrationsResolver, MigrationsStatusResolver } from '@contember/migrations-client'
import { SystemClientProvider } from '../SystemClientProvider'
import { MigrationPrinter } from './MigrationPrinter'

export class MigrationsStatusFacade {
	constructor(
		private readonly systemClientProvider: SystemClientProvider,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationsStatusResolver: MigrationsStatusResolver,
		private readonly migrationPrinter: MigrationPrinter,
	) {
	}


	public resolveMigrationsStatus = async ({ force, allowError }: { force?: boolean; allowError?: boolean }) => {
		const executedMigrations = await this.systemClientProvider.get().listExecutedMigrations()
		const localMigrations = await this.migrationsResolver.getMigrationFiles()
		const status = await this.migrationsStatusResolver.getMigrationsStatus(executedMigrations, localMigrations, force)
		if (status.errorMigrations.length > 0 && !allowError) {
			console.error(this.migrationPrinter.printStatusTable(status.errorMigrations))
			if (!force) {
				throw `Cannot execute migrations`
			}
		}

		return status
	}
}
