import { ProjectManager, Providers as TenantProviders } from '@contember/engine-tenant-api'
import { MigrationsRunner } from '@contember/database-migrations'
import { ProjectInitializer } from '@contember/engine-system-api'
import { ProjectContainer } from '@contember/engine-http'
import { TenantCredentials, TenantMigrationArgs } from '@contember/engine-tenant-api'
import { Logger } from '@contember/engine-common'

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
		const logger = new Logger(console.log)
		logger.group('\nInitializing tenant database')
		await this.tenantDbMigrationsRunner.migrate<TenantMigrationArgs>(logger.write.bind(logger), {
			credentials: this.tenantCredentials,
			providers: this.providers,
		})
		logger.groupEnd()

		for (const container of this.projectContainers) {
			const project = container.project
			logger.group(`\nUpdating project ${project.slug}`)
			const tenantUpdated = await this.projectManager.createOrUpdateProject(project)
			if (tenantUpdated) {
				logger.write(`Tenant metadata updated`)
			}

			await this.projectInitializer.initialize(container.systemDatabaseContextFactory, project, logger)
			logger.groupEnd()
		}
		// eslint-disable-next-line no-console
		console.log('')
	}
}
