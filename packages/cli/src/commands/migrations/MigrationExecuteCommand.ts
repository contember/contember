import { Command, CommandConfiguration, Input } from '../../cli'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getProjectDirectories } from '../../NamingHelper'
import { getMigrationByName } from '../../utils/migrations'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken } from '../../utils/tenant'
import { SystemClient } from '../../utils/system'

type Args = {
	project: string
	migration: string
	instance?: string
}

type Options = {
	['remote-project']?: string
}

export class MigrationExecuteCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Executes a migration')
		configuration.argument('project')
		configuration.argument('migration')
		configuration
			.argument('instance')
			.optional()
			.description('Local instance name or remote Contember API URL')
		configuration
			.option('remote-project')
			.valueRequired()
			.description('Specify this when remote project name does not match local project name.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const { migrationsDir } = getProjectDirectories(projectName)
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const migrationArg = input.getArgument('migration')
		const migrationsResolver = container.migrationsResolver
		const migration = await getMigrationByName(migrationsResolver, migrationArg)
		if (!migration) {
			throw 'Undefined migration'
		}
		const instance = await interactiveResolveInstanceEnvironmentFromInput(input)
		const apiToken = await interactiveResolveApiToken({ instance })
		const remoteProject = input.getOption('remote-project') || projectName
		const client = SystemClient.create(instance.baseUrl, remoteProject, apiToken)
		const result = await client.migrate([migration])
		if (result.ok) {
			console.log('Migration executed')
			return 0
		}
		console.error(result.errors)
		return 1
	}
}
