import { ProjectManager, Providers as TenantProviders } from '@contember/engine-tenant-api'
import { MigrationsRunner } from '@contember/database-migrations'
import { ProjectInitializer } from '@contember/engine-system-api'
import { ProjectContainer } from '@contember/engine-http'
import { TenantCredentials, TenantMigrationArgs } from '@contember/engine-tenant-api/src'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunner: MigrationsRunner,
		private readonly projectManager: ProjectManager,
		private readonly projectInitializer: ProjectInitializer,
		private readonly projectContainers: ProjectContainer[],
		private readonly tenantCredentials: TenantCredentials,
		private readonly providers: TenantProviders,
	) {}

	public async initialize(): Promise<void> {
		console.log()
		console.group('Initializing tenant database')
		console.group('Executing migrations')
		await this.tenantDbMigrationsRunner.migrate<TenantMigrationArgs>(true, {
			credentials: this.tenantCredentials,
			providers: this.providers,
		})
		console.groupEnd()
		console.groupEnd()

		for (const container of this.projectContainers) {
			const project = container.project
			console.log()
			console.group(`Initializing ${project.slug} database`)

			console.group(`Updating metadata in project table in tenant db`)
			await this.projectManager.createOrUpdateProject(project)
			console.groupEnd()

			await this.projectInitializer.initialize(container.systemDatabaseContextFactory, project)

			console.groupEnd()
		}
	}
}
