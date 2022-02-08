import { ProjectContainerFactory } from './ProjectContainer'
import { ProjectContainer } from '@contember/engine-http'
import { DatabaseContext, ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectInitializer as SystemProjectInitializer } from '@contember/engine-system-api'
import { ProjectContainerStore } from './ProjectContainerStore'
import { Logger } from '@contember/engine-common'
import { ProjectConfigResolver } from '../config/projectConfigResolver'

export class ProjectContainerResolver {
	private projectContainers = new ProjectContainerStore()

	public readonly onCreate: ((container: ProjectContainer) => void | (() => void))[] = []

	constructor(
		private readonly projectContainerFactory: ProjectContainerFactory,
		private readonly projectConfigResolver: ProjectConfigResolver,
		private readonly projectManager: ProjectManager,
		private readonly systemProjectInitializer: SystemProjectInitializer,
		private readonly tenantDatabase: DatabaseContext,
	) {}

	public async getAllProjectContainers(): Promise<ProjectContainer[]> {
		const projects = await this.projectManager.getProjects(this.tenantDatabase)
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
		const realSlug = this.projectContainers.resolveAlias(slug)
		if (realSlug) {
			slug = realSlug
		}
		const existing = this.projectContainers.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			const state = await this.projectManager.getProjectState(this.tenantDatabase, slug, existingAwaited.timestamp)
			if (state === 'valid') {
				return (await existingAwaited).container
			}
			await this.destroyContainer(slug)
			if (state === 'not_found') {
				return undefined
			}
		}
		const project = await this.projectManager.getProjectWithSecretsBySlug(this.tenantDatabase, slug, alias)
		if (!project) {
			return undefined
		}
		const container = await this.createProjectContainer(project)
		if (slug !== project.slug) {
			this.projectContainers.setAlias(project.slug, slug)
		}
		return container
	}

	public async createProjectContainer(project: ProjectWithSecrets): Promise<ProjectContainer> {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets)
		return (await this.projectContainers.fetchContainer(project.slug, async slug => {
			const projectContainer = this.projectContainerFactory.createContainer({
				project: projectConfig,
			})
			await this.systemProjectInitializer.initialize(
				projectContainer.systemDatabaseContextFactory,
				projectContainer.project,
				// eslint-disable-next-line no-console
				new Logger(console.log),
			)
			const cleanups = this.onCreate.map(it => it(projectContainer) || (() => null))
			return {
				container: projectContainer,
				cleanups,
				timestamp: project.updatedAt,
			}
		})).container
	}

	public async destroyContainer(slug: string): Promise<void> {
		const existing = this.projectContainers.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			existingAwaited.cleanups.forEach(it => it())
			existingAwaited.container.project.alias?.forEach(it => this.projectContainers.removeAlias(it))
			this.projectContainers.removeContainer(slug)
		}
		process.nextTick(() => {
			if (global.gc) {
				global.gc()
			}
		})
	}
}
