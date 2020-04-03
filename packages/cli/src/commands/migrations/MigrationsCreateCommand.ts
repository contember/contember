import { Command, CommandConfiguration, Input } from '../../cli'
import { configureCreateMigrationCommand, executeCreateMigrationCommand } from './MigrationCreateMigrationHelper'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class MigrationsCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates empty schema migration for given project')
		configureCreateMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		await executeCreateMigrationCommand(input, async ({ projectDir, migrationName, migrationCreator }) => {
			const result = await migrationCreator.createEmpty(migrationName)
			console.log(`${result} created`)
		})
	}
}
