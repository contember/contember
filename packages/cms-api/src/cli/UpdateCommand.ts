import CommandConfiguration from '../core/cli/CommandConfiguration'
import { ProjectContainer } from '../CompositionRoot'
import Command from '../core/cli/Command'
import ProjectManager from '../tenant-api/model/service/ProjectManager'
import MigrationsRunner from '../core/migrations/MigrationsRunner'

class UpdateCommand extends Command<{}, {}> {
	constructor(
		private readonly tenantDbMigrationsRunner: MigrationsRunner,
		private readonly projectManager: ProjectManager,
		private readonly projectContainers: ProjectContainer[]
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Executes tenant, system and project migrations and updates project entries.')
	}

	protected async execute(): Promise<void> {
		console.log(`Executing tenant db migration`)
		await this.tenantDbMigrationsRunner.migrate()
		console.log(`done`)
		await Promise.all(
			this.projectContainers.map(async container => {
				const project = container.project
				await this.projectManager.createOrUpdateProject(project)
				console.log(`Project ${project.slug} updated`)

				console.log(`Executing system schema migration for project ${project.slug}`)
				await container.systemDbMigrationsRunner.migrate()
				console.log(`Done`)

				await container.systemDbClient.transaction(async trx => {
					const executionContainer = container.systemExecutionContainerFactory.create(trx)

					const init = executionContainer.projectIntializer
					await init.initialize()
				})
			})
		)
	}
}

export default UpdateCommand
