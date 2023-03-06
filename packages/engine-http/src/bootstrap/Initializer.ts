import { ProjectGroupContainer } from '../projectGroup/ProjectGroupContainer'

export class Initializer {
	constructor(
		private readonly projectGroupContainer: ProjectGroupContainer,
	) {}

	public async initialize(): Promise<string[]> {
		const groupContainer = await this.projectGroupContainer
		const tenantMigrationsLogger = groupContainer.logger.child()
		const tenantContainer = groupContainer.tenantContainer
		await tenantContainer.migrationsRunner.run(tenantMigrationsLogger)

		const projects: string[] = []

		const tenantProjects = await tenantContainer.projectManager.getProjects(tenantContainer.databaseContext)
		for (const { slug: projectSlug } of tenantProjects) {
			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(projectSlug, { alias: false })
			if (!projectContainer) {
				throw new Error()
			}
			const project = projectContainer.project
			projects.push(project.slug)
		}
		return projects
	}
}
