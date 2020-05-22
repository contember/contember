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
		// eslint-disable-next-line no-console
		console.log()
		// eslint-disable-next-line no-console
		console.group('Initializing tenant database')
		await this.tenantDbMigrationsRunner.migrate<TenantMigrationArgs>(true, {
			credentials: this.tenantCredentials,
			providers: this.providers,
		})
		// eslint-disable-next-line no-console
		console.groupEnd()

		for (const container of this.projectContainers) {
			const project = container.project
			// eslint-disable-next-line no-console
			console.log()
			// eslint-disable-next-line no-console
			console.group(`Initializing ${project.slug} database`)

			// eslint-disable-next-line no-console
			console.group(`Updating metadata in project table in tenant db`)
			await this.projectManager.createOrUpdateProject(project)
			// eslint-disable-next-line no-console
			console.groupEnd()

			await this.projectInitializer.initialize(container.systemDatabaseContextFactory, project)

			// eslint-disable-next-line no-console
			console.groupEnd()
		}
	}
}
