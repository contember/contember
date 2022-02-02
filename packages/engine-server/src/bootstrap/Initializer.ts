import { MigrationsRunnerFactory, ProjectGroupProvider } from '@contember/engine-tenant-api'
import { ProjectInitializer } from '@contember/engine-system-api'
import { Logger } from '@contember/engine-common'
import { ProjectContainerResolver } from '../project'

export class Initializer {
	constructor(
		private readonly tenantDbMigrationsRunnerFactory: MigrationsRunnerFactory,
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
		const group = await this.projectGroupProvider.getGroup(undefined)
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
}
