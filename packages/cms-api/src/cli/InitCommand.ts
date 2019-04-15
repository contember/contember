import CommandConfiguration from '../core/cli/CommandConfiguration'
import { ProjectContainer } from '../CompositionRoot'
import Command from '../core/cli/Command'
import ProjectManager from '../tenant-api/model/service/ProjectManager'

class InitCommand extends Command<{}, {}> {
	constructor(private readonly projectManager: ProjectManager, private readonly projectContainers: ProjectContainer[]) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {}

	protected async execute(): Promise<void> {
		await Promise.all(
			this.projectContainers.map(async container => {
				const project = container.project
				await this.projectManager.createOrUpdateProject(project)
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
