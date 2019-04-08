import CommandConfiguration from '../core/cli/CommandConfiguration'
import CreateProjectCommand from '../tenant-api/model/commands/CreateProjectCommand'
import { ProjectContainer } from '../CompositionRoot'
import Command from '../core/cli/Command'
import KnexWrapper from '../core/knex/KnexWrapper'


class InitCommand extends Command<{}, {}> {

	constructor(
		private readonly tenantDb: KnexWrapper,
		private readonly projectContainers: ProjectContainer[]
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
	}

	protected async execute(): Promise<void> {
		await Promise.all(
			this.projectContainers.map(async container => {

				const project = container.project
				await new CreateProjectCommand(project).execute(this.tenantDb)
				console.log(`Project ${project.slug} updated`)
				await container.systemKnexWrapper.transaction(async trx => {
					const executionContainer = container.systemExecutionContainerFactory.create(trx)

					const init = executionContainer.projectIntializer
					await init.initialize()
				})

			})
		)
	}
}

export default InitCommand
