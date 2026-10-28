import { ProjectContainer, ProjectContainerFactory } from './ProjectContainer'
import { DatabaseContext, ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectContainerStore } from './ProjectContainerStore'
import { ProjectConfigResolver } from '../config/projectConfigResolver'
import { TenantConfig } from '../config/config'
import { Logger } from '@contember/logger'
import { EventEmitter, EventManager } from '@contember/engine-common'

export type ProjectContainerResolverEvents = {
	create: (args: { container: ProjectContainer }) => (() => void) | void
	destroy: (args: { container: ProjectContainer }) => void
}

export class ProjectContainerResolver implements EventEmitter<ProjectContainerResolverEvents> {
	private projectContainers = new ProjectContainerStore()
	private eventManager = new EventManager<ProjectContainerResolverEvents>()
	private disposed = false

	public readonly on = this.eventManager.on.bind(this.eventManager)

	constructor(
		private readonly projectContainerFactory: ProjectContainerFactory,
		private readonly projectConfigResolver: ProjectConfigResolver,
		private readonly projectManager: Pick<ProjectManager, 'getProjectState' | 'getProjectWithSecretsBySlug'>,
		private readonly tenantDatabase: DatabaseContext,
		private readonly tenantConfig: TenantConfig,
	) {}

	public async getProjectContainer(slug: string, { alias = false }: { alias?: boolean } = {}): Promise<ProjectContainer | undefined> {
		const realSlug = this.projectContainers.resolveAlias(slug)
		if (realSlug) {
			slug = realSlug
		}
		const existing = this.disposed ? undefined : this.projectContainers.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			const state = await this.projectManager.getProjectState(this.tenantDatabase, slug, existingAwaited.timestamp)
			if (state === 'valid') {
				return existingAwaited.container
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
		if (slug !== project.slug && !this.disposed) {
			this.projectContainers.setAlias(project.slug, slug)
		}
		return container
	}

	public async createProjectContainer(project: ProjectWithSecrets, logger?: Logger): Promise<ProjectContainer> {
		if (this.disposed) {
			// A request that still holds the disposed group gets a container nobody tracks; its pool closes on idle timeout.
			return await this.initializeContainer(project, logger)
		}
		return (await this.projectContainers.fetchContainer(project.slug, async () => {
			const projectContainer = await this.initializeContainer(project, logger)

			const cleanups = this.eventManager.fire('create', { container: projectContainer }).map(it => it ?? (() => null))
			return {
				container: projectContainer,
				cleanups,
				timestamp: project.updatedAt,
			}
		})).container
	}

	/**
	 * Destroys all cached containers. Containers requested afterwards are neither cached nor announced to 'create' listeners.
	 */
	public async dispose(): Promise<void> {
		this.disposed = true
		await Promise.allSettled(this.projectContainers.getSlugs().map(slug => this.destroyContainer(slug)))
	}

	private async initializeContainer(project: ProjectWithSecrets, logger?: Logger): Promise<ProjectContainer> {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets, this.tenantConfig)
		const projectContainer = this.projectContainerFactory.createContainer({
			project: projectConfig,
		})
		await projectContainer.projectInitializer.initialize(logger ?? projectContainer.logger)
		return projectContainer
	}

	public async destroyContainer(slug: string): Promise<void> {
		const existing = this.projectContainers.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			existingAwaited.cleanups.forEach(it => it())
			this.eventManager.fire('destroy', { container: existingAwaited.container })
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
