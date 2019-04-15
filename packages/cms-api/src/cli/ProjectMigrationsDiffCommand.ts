import Command from '../core/cli/Command'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import { Schema } from 'cms-common'
import { ProjectContainerResolver } from '../CompositionRoot'

type Args = {
	projectName: string
	migrationName: string
}

class ProjectMigrationsDiffCommand extends Command<Args, {}> {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly schemas: { [name: string]: Schema }
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates .json and .sql schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
	}

	protected async execute(input: Command.Input<Args, {}>): Promise<void> {
		const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]

		const projectContainer = this.projectContainerResolver(projectName)
		if (!projectContainer) {
			throw new Error(`Undefined project ${projectName}`)
		}

		const executionContainer = projectContainer.systemExecutionContainerFactory.create(
			projectContainer.systemKnexWrapper
		)
		const migrationDiffCreator = executionContainer.migrationDiffCreator
		const result = await migrationDiffCreator.createDiff(this.schemas[projectName], migrationName)

		if (result === null) {
			console.log('Nothing to do')
			return
		}

		console.log(`${result} created`)
	}
}

export default ProjectMigrationsDiffCommand
