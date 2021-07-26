import { SchemaVersionBuilder } from '@contember/engine-system-api'
import { createProjectContainer } from './ProjectContainer'
import { Plugin } from '@contember/engine-plugins'
import { ProjectConfigResolver, ProjectContainer, Providers } from '@contember/engine-http'
import { ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'

export class ProjectContainerResolver {
	private containers = new Map<string, ProjectContainer>()
	public readonly onCreate: ((container: ProjectContainer) => void)[] = []
	constructor(
		private debug: boolean,
		private projectConfigResolver: ProjectConfigResolver,
		private projectManager: ProjectManager,
		private plugins: Plugin[],
		private schemaVersionBuilder: SchemaVersionBuilder,
		private providers: Providers,
	) {}

	public async getAllProjectContainers(): Promise<ProjectContainer[]> {
		const projects = await this.projectManager.getProjects()
		return await Promise.all(
			projects.map(async it => {
				const container = await this.getProjectContainer(it.slug)
				if (!container) {
					throw new Error('should not happen')
				}
				return container
			}),
		)
	}

	public getExistingProjectContainer(): ProjectContainer[] {
		return Array.from(this.containers.values())
	}

	public async getProjectContainer(slug: string, alias: boolean = false): Promise<ProjectContainer | undefined> {
		// todo: process alias
		const existing = this.containers.get(slug)
		if (existing) {
			return existing
		}
		const project = await this.projectManager.getProjectWithSecretsBySlug(slug)
		if (!project) {
			return undefined
		}
		return this.createProjectContainer(project)
	}

	private createProjectContainer(project: ProjectWithSecrets): ProjectContainer {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets)
		const existing = this.containers.get(project.slug)
		if (existing) {
			return existing
		}
		const projectContainer = createProjectContainer(
			this.debug,
			projectConfig,
			this.plugins,
			this.schemaVersionBuilder,
			this.providers,
		)
		this.onCreate.forEach(it => it(projectContainer))
		this.containers.set(project.slug, projectContainer)
		return projectContainer
	}
}
