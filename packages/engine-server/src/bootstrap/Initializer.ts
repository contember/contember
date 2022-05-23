import { Logger } from '@contember/engine-common'
import { ProjectGroupContainer } from '@contember/engine-http'

export class Initializer {
	constructor(
		private readonly projectGroupContainer: ProjectGroupContainer,
	) {}

	public async initialize(): Promise<string[]> {
		// eslint-disable-next-line no-console
		const logger = new Logger(console.log)
		logger.group('\nInitializing tenant database')
		// todo
		const groupContainer = await this.projectGroupContainer

		await groupContainer.tenantContainer.migrationsRunner.run(logger.write.bind(logger))
		logger.groupEnd()

		const systemContainer = groupContainer.systemContainer
		const projects: string[] = []
		for (const projectContainer of await groupContainer.projectContainerResolver.getAllProjectContainers()) {
			const project = projectContainer.project
			projects.push(project.slug)
			logger.group(`\nUpdating project ${project.slug}`)
			await systemContainer.projectInitializer.initialize(projectContainer.systemDatabaseContextFactory, project, logger)
			logger.groupEnd()
		}
		// eslint-disable-next-line no-console
		console.log('')
		return projects
	}
}
