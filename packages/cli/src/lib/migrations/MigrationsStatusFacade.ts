import { ExecutedMigrationInfo, MigrationsResolver, MigrationsStatusResolver } from '@contember/migrations-client'
import { SystemClientProvider } from '../SystemClientProvider.js'
import { MigrationPrinter } from './MigrationPrinter.js'
import { CliError, ExitCode, Output } from '@contember/cli-common'

export class MigrationsStatusFacade {
	constructor(
		private readonly systemClientProvider: SystemClientProvider,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationsStatusResolver: MigrationsStatusResolver,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly output: Output = new Output(),
	) {
	}

	public getLocalMigrationFiles = () => this.migrationsResolver.getMigrationFiles()

	public resolveMigrationsStatus = async ({ force, allowError }: { force?: boolean; allowError?: boolean }) => {
		const executedMigrations = await this.systemClientProvider.get().listExecutedMigrations()
		return await this.resolveMigrationsStatusFromExecuted(executedMigrations, { force, allowError })
	}

	public resolveMigrationsStatusFromExecuted = async (
		executedMigrations: ExecutedMigrationInfo[],
		{ force, allowError }: { force?: boolean; allowError?: boolean },
	) => {
		const localMigrations = await this.migrationsResolver.getMigrationFiles()
		const status = await this.migrationsStatusResolver.getMigrationsStatus(executedMigrations, localMigrations, force)
		if (status.errorMigrations.length > 0 && !allowError) {
			// diagnostic context for the failure below, so it goes to stderr unstyled
			for (const line of this.migrationPrinter.formatStatusTable(status.errorMigrations).split('\n')) {
				this.output.info(line)
			}
			if (!force) {
				throw new CliError('Cannot execute migrations', { code: 'MIGRATIONS_BROKEN', exitCode: ExitCode.InputError })
			}
		}

		return status
	}
}
