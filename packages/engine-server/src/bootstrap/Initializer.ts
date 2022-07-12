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

		const tenantContainer = groupContainer.tenantContainer
		await tenantContainer.migrationsRunner.run(logger.write.bind(logger))
		logger.groupEnd()

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
			logger.groupEnd()
		}
		// eslint-disable-next-line no-console
		console.log('')
		return projects
	}
}
