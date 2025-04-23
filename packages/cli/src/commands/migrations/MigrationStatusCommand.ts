import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationFilesManager, MigrationState, sortMigrations, SystemClient } from '@contember/migrations-client'
import chalk from 'chalk'
import { MigrationsStatusFacade } from '../../lib/migrations/MigrationsStatusFacade'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter'
import { SystemClientProvider } from '../../lib/SystemClientProvider'

type Args = {
}

type Options = {
	['only-to-execute']?: true
	['only-errors']?: true
	['restore-missing']?: true
}

export class MigrationStatusCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationsStatusFacade: MigrationsStatusFacade,
		private readonly migrationFilesManager: MigrationFilesManager,
		private readonly systemClientProvider: SystemClientProvider,
		private readonly migrationPrinter: MigrationPrinter,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Shows status of executed migrations on an instance & sync status')
		configuration //
			.option('only-errors')
			.valueNone()
			.description('Show only migrations with an error.')
		configuration //
			.option('only-to-execute')
			.valueNone()
			.description('Show only migrations to execute.')
		configuration //
			.option('restore-missing')
			.valueNone()
			.description('Restores migrations locally missing')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {

		const onlyErrors = input.getOption('only-errors')
		const onlyToExecute = input.getOption('only-to-execute')
		const restoreMissing = input.getOption('restore-missing')

		let status = await this.migrationsStatusFacade.resolveMigrationsStatus({ allowError: true })

		if (restoreMissing) {
			const missing = status.errorMigrations.filter(it => it.state === MigrationState.EXECUTED_MISSING)
			for (const migration of missing) {
				console.log(`Restoring migration ${migration.name}`)
				const fullMigration = await this.systemClientProvider.get().getExecutedMigration(migration.version)
				await this.migrationFilesManager.createFile(
					JSON.stringify(
						{
							formatVersion: fullMigration.formatVersion,
							modifications: fullMigration.modifications,
						},
						undefined,
						'\t',
					) + '\n',
					fullMigration.name,
				)
			}
			status = await this.migrationsStatusFacade.resolveMigrationsStatus({})
		}



		const filtered =
			onlyErrors || onlyToExecute
				? sortMigrations([
					...(onlyErrors ? status.errorMigrations : []),
					...(onlyToExecute ? status.migrationsToExecute : []),
				  ])
				: status.allMigrations

		console.log(this.migrationPrinter.printStatusTable(filtered))

		const hasErrors = status.errorMigrations.length > 0

		if (hasErrors) {
			console.error(chalk.redBright('Some migrations are broken'))
		}

		return hasErrors ? 1 : 0
	}
}
