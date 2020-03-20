import { Command, CommandConfiguration, Input } from '../../cli'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getProjectDirectories } from '../../NamingHelper'

type Args = {
	project: string
	migration?: string
}

type Options = {}

export class MigrationDescribeCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Describes a migration')
		configuration.argument('project')
		configuration.argument('migration').optional()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const projectName = input.getArgument('project')

		const { migrationsDir } = getProjectDirectories(projectName)
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const sql = await container.migrationDryRunner.getSql(input.getArgument('migration'))
		if (!sql.trim()) {
			console.log('No SQL to execute')
		} else {
			console.log(sql)
		}
	}
}
