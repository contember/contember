import { SchemaVersionBuilder } from '@contember/engine-system-api'
import { createProjectContainer } from './ProjectContainer'
import { Plugin } from '@contember/engine-plugins'
import { ProjectConfigResolver, ProjectContainer, Providers } from '@contember/engine-http'
import { ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'

export class ProjectContainerResolver {
	private containers = new Map<string, { container: ProjectContainer; cleanups: (() => void)[]; timestamp: Date }>()
	private aliasMapping = new Map<string, string>()

	public readonly onCreate: ((container: ProjectContainer) => void | (() => void))[] = []
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

	public async getProjectContainer(slug: string, alias: boolean = false): Promise<ProjectContainer | undefined> {
		const realSlug = this.aliasMapping.get(slug)
		if (realSlug) {
			slug = realSlug
		}
		const existing = this.containers.get(slug)
		if (existing) {
			const state = await this.projectManager.getProjectState(slug, existing.timestamp)
			if (state === 'valid') {
				return existing.container
			}
			this.destroyContainer(slug)
			if (state === 'not_found') {
				return undefined
			}
		}
		const project = await this.projectManager.getProjectWithSecretsBySlug(slug, alias)
		if (!project) {
			return undefined
		}
		const container = this.createProjectContainer(project)
		if (slug !== project.slug) {
			this.aliasMapping.set(slug, project.slug)
		}
		return container
	}

	public createProjectContainer(project: ProjectWithSecrets): ProjectContainer {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets)
		const existing = this.containers.get(project.slug)
		if (existing) {
			return existing.container
		}
		const projectContainer = createProjectContainer(
			this.debug,
			projectConfig,
			this.plugins,
			this.schemaVersionBuilder,
			this.providers,
		)
		const cleanups = this.onCreate.map(it => it(projectContainer) || (() => null))
		this.containers.set(project.slug, {
			container: projectContainer,
			cleanups,
			timestamp: project.updatedAt,
		})
		return projectContainer
	}

	public destroyContainer(slug: string): void {
		const existing = this.containers.get(slug)
		if (existing) {
			existing.cleanups.forEach(it => it())
			existing.container.project.alias?.forEach(it => this.aliasMapping.delete(it))
			this.containers.delete(slug)
		}
		process.nextTick(() => {
			if (global.gc) {
				global.gc()
			}
		})
	}
}
