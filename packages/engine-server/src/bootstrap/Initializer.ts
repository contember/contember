import { ProjectContainer } from '../ProjectContainer'
import { ProjectManager } from '@contember/engine-tenant-api'
import { MigrationsRunner } from '@contember/database-migrations'
import { ProjectInitializer } from '@contember/engine-system-api'
import { DatabaseCredentials } from '@contember/database'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunner: MigrationsRunner,
		private readonly projectManager: ProjectManager,
		private readonly projectInitializer: ProjectInitializer,
		private readonly systemDbMigrationRunnerFactory: (db: DatabaseCredentials) => MigrationsRunner,
		private readonly projectContainers: ProjectContainer[],
	) {}

	public async initialize(): Promise<void> {
		console.log()
		console.group('Initializing tenant database')
		console.group('Executing migrations')
		await this.tenantDbMigrationsRunner.migrate()
		console.groupEnd()
		console.groupEnd()

		for (const container of this.projectContainers) {
			const project = container.project
			console.log()
			console.group(`Initializing ${project.slug} database`)

			console.group(`Updating metadata in project table in tenant db`)
			await this.projectManager.createOrUpdateProject(project)
			console.groupEnd()

			console.group(`Executing system schema migration`)
			await this.systemDbMigrationRunnerFactory(project.db).migrate()
			console.groupEnd()

			const init = this.projectInitializer
			await init.initialize(container.systemDatabaseContextFactory, project)

			console.groupEnd()
		}
	}
}
