import { ProjectContainer } from './CompositionRoot'
import { MigrationsRunner } from '@contember/engine-common'
import { ProjectManager } from '@contember/engine-tenant-api'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunner: MigrationsRunner,
		private readonly projectManager: ProjectManager,
		private readonly projectContainers: ProjectContainer[],
	) {}

	public async initialize(): Promise<void> {
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
			}),
		)
	}
}
