import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { configureCreateMigrationCommand, executeCreateMigrationCommand } from './MigrationCreateHelper'

type Args = {
	project: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class MigrationCreateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates empty schema migration for given project')
		configureCreateMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		return await executeCreateMigrationCommand(input, async ({ migrationCreator }) => {
			const migrationName = input.getArgument('migrationName')
			const result = await migrationCreator.createEmpty(migrationName)
			console.log(`${result} created`)
			return 0
		})
	}
}
