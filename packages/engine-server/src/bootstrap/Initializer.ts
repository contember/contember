import {
	ProjectManager,
	Providers as TenantProviders,
	TenantCredentials,
	TenantMigrationArgs,
} from '@contember/engine-tenant-api'
import { MigrationsRunner } from '@contember/database-migrations'
import { ProjectInitializer } from '@contember/engine-system-api'
import { Logger } from '@contember/engine-common'
import { ProjectContainerResolver } from '../project'
import { ProjectConfig } from '@contember/engine-http'
import { Migration } from '@contember/schema-migrations'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunner: MigrationsRunner,
		private readonly projectManager: ProjectManager,
		private readonly projectInitializer: ProjectInitializer,
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly tenantCredentials: TenantCredentials,
		private readonly providers: TenantProviders,
	) {}

	public async initialize(): Promise<string[]> {
		// eslint-disable-next-line no-console
		const logger = new Logger(console.log)
		logger.group('\nInitializing tenant database')
		await this.tenantDbMigrationsRunner.migrate<TenantMigrationArgs>(logger.write.bind(logger), {
			credentials: this.tenantCredentials,
			providers: this.providers,
		})
		logger.groupEnd()

		const projects: string[] = []
		for (const container of await this.projectContainerResolver.getAllProjectContainers()) {
			const project = container.project
			projects.push(project.slug)
			logger.group(`\nUpdating project ${project.slug}`)
			await this.projectInitializer.initialize(container.systemDatabaseContextFactory, project, logger)
			logger.groupEnd()
		}
		// eslint-disable-next-line no-console
		console.log('')
		return projects
	}

	public async createProject(project: ProjectConfig, migrations: Migration[]): Promise<void> {
		const { slug, name, ...config } = project
		const result = await this.projectManager.createProject({ slug, name, config, secrets: {} }, undefined)
		if (!result) {
			throw new Error('Project already exists')
		}
		const container = await this.projectContainerResolver.getProjectContainer(project.slug)
		if (!container) {
			throw new Error('Should not happen')
		}
		await this.projectInitializer.initialize(
			container.systemDatabaseContextFactory,
			project,
			new Logger(() => null),
			migrations,
		)
	}
}
