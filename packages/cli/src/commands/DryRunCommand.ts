import CommandConfiguration from '../cli/CommandConfiguration'
import Command from '../cli/Command'
import { Input } from '../cli/Input'
import { MigrationsContainerFactory } from '../MigrationsContainer'
import { getProjectMigrationsDir } from '../NamingHelper'

type Args = {
	project: string
	migration?: string
}

class DryRunCommand extends Command<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Show SQL executed by a migration')
		configuration.argument('project')
		configuration.argument('migration').optional()
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const projectName = input.getArgument('project')

		const container = new MigrationsContainerFactory(getProjectMigrationsDir(projectName)).create()

		const sql = await container.migrationDryRunner.getSql(input.getArgument('migration'))
		if (!sql.trim()) {
			console.log('No SQL to execute')
		} else {
			console.log(sql)
		}
	}
}

export default DryRunCommand
