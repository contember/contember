import { Logger } from '@contember/engine-common'
import { ProjectGroupContainerResolver } from '../projectGroup/ProjectGroupContainerResolver'

export class Initializer {
	constructor(
		private readonly projectGroupContainerResolver: ProjectGroupContainerResolver,
	) {}

	public async initialize(): Promise<string[]> {
		// eslint-disable-next-line no-console
		const logger = new Logger(console.log)
		logger.group('\nInitializing tenant database')
		// todo
		const groupContainer = await this.projectGroupContainerResolver.getProjectGroupContainer(undefined)

		const tenantContainer = groupContainer.tenantContainer
		await tenantContainer.migrationsRunner.run(logger.write.bind(logger))
		logger.groupEnd()

		const systemContainer = groupContainer.systemContainer
		const projects: string[] = []

		const tenantProjects = await tenantContainer.projectManager.getProjects(tenantContainer.databaseContext)
		for (const { slug: projectSlug } of tenantProjects) {
			logger.group(`\nUpdating project ${projectSlug}`)
			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(projectSlug, {
				alias: false,
				logger,
			})
			if (!projectContainer) {
				throw new Error()
			}
			const project = projectContainer.project
			projects.push(project.slug)
			await systemContainer.projectInitializer.initialize(projectContainer.systemDatabaseContextFactory, project, logger)
			logger.groupEnd()
		}
		// eslint-disable-next-line no-console
		console.log('')
		return projects
	}
}
