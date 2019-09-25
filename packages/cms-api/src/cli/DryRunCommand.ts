import CommandConfiguration from '../core/cli/CommandConfiguration'
import { ProjectContainer } from '../CompositionRoot'
import Command from '../core/cli/Command'
import { Input } from '../core/cli/Input'

type Args = {
	project: string
	migration?: string
}

class DryRunCommand extends Command<Args, {}> {
	constructor(private readonly projectContainers: ProjectContainer[]) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Show SQL executed by a migration')
		configuration.argument('project')
		configuration.argument('migration').optional()
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const projectSlug = input.getArgument('project')
		const projectContainer = this.projectContainers.find(it => it.project.slug === projectSlug)
		if (!projectContainer) {
			throw new Error(`Undefined project ${projectSlug}`)
		}
		const container = projectContainer.systemExecutionContainerFactory.create(projectContainer.systemDbClient)
		const sql = await container.migrationSqlDryRunner.getSql(input.getArgument('migration'))
		if (!sql.trim()) {
			console.log('No SQL to execute')
		} else {
			console.log(sql)
		}
	}
}

export default DryRunCommand
