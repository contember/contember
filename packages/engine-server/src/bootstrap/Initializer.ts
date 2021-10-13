import { MigrationsRunnerFactory, ProjectGroupProvider, ProjectManager } from '@contember/engine-tenant-api'
import { ProjectInitializer } from '@contember/engine-system-api'
import { Logger } from '@contember/engine-common'
import { ProjectContainerResolver } from '../project'
import { ProjectConfig } from '@contember/engine-http'
import { Migration } from '@contember/schema-migrations'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunnerFactory: MigrationsRunnerFactory,
		private readonly projectManager: ProjectManager,
		private readonly projectInitializer: ProjectInitializer,
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly projectGroupProvider: ProjectGroupProvider,
	) {}

	public async initialize(): Promise<string[]> {
		// eslint-disable-next-line no-console
		const logger = new Logger(console.log)
		logger.group('\nInitializing tenant database')
		// todo
		await this.tenantDbMigrationsRunnerFactory.create('tenant').run(logger.write.bind(logger))
		logger.groupEnd()

		const projects: string[] = []
		const group = await this.projectGroupProvider.getGroup(undefined) // todo
		for (const container of await this.projectContainerResolver.getAllProjectContainers(group)) {
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
		const group = await this.projectGroupProvider.getGroup(undefined) // todo
		const result = await this.projectManager.createProject(group, { slug, name, config, secrets: {} }, undefined)
		if (!result) {
			throw new Error('Project already exists')
		}
		const container = await this.projectContainerResolver.getProjectContainer(group, project.slug)
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
