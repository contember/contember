import { ProjectContainerFactory } from './ProjectContainer'
import { ProjectConfigResolver, ProjectContainer } from '@contember/engine-http'
import { ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectGroup } from '@contember/engine-tenant-api'
import { ProjectInitializer as SystemProjectInitializer } from '@contember/engine-system-api'
import { ProjectGroupState } from './ProjectGroupState'
import { Logger } from '@contember/engine-common'

export class ProjectContainerResolver {
	private projectGroupStates = new WeakMap<ProjectGroup, ProjectGroupState>()

	public readonly onCreate: ((container: ProjectContainer) => void | (() => void))[] = []

	constructor(
		private readonly projectContainerFactory: ProjectContainerFactory,
		private readonly projectConfigResolver: ProjectConfigResolver,
		private readonly projectManager: ProjectManager,
		private readonly systemProjectInitializer: SystemProjectInitializer,
	) {}

	public async getAllProjectContainers(projectGroup: ProjectGroup): Promise<ProjectContainer[]> {
		const projects = await this.projectManager.getProjects(projectGroup.database)
		return await Promise.all(
			projects.map(async it => {
				const container = await this.getProjectContainer(projectGroup, it.slug)
				if (!container) {
					throw new Error('should not happen')
				}
				return container
			}),
		)
	}

	public async getProjectContainer(projectGroup: ProjectGroup, slug: string, alias: boolean = false): Promise<ProjectContainer | undefined> {
		let groupState = this.getProjectGroupState(projectGroup)

		const realSlug = groupState.resolveAlias(slug)
		if (realSlug) {
			slug = realSlug
		}
		const existing = groupState.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			const state = await this.projectManager.getProjectState(projectGroup.database, slug, existingAwaited.timestamp)
			if (state === 'valid') {
				return (await existingAwaited).container
			}
			await this.destroyContainer(projectGroup, slug)
			if (state === 'not_found') {
				return undefined
			}
		}
		const project = await this.projectManager.getProjectWithSecretsBySlug(projectGroup.database, slug, alias)
		if (!project) {
			return undefined
		}
		const container = await this.createProjectContainer(projectGroup, project)
		if (slug !== project.slug) {
			groupState.setAlias(project.slug, slug)
		}
		return container
	}

	public async createProjectContainer(projectGroup: ProjectGroup, project: ProjectWithSecrets): Promise<ProjectContainer> {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets)
		const groupState = this.getProjectGroupState(projectGroup)
		return (await groupState.fetchContainer(project.slug, async slug => {
			const projectContainer = this.projectContainerFactory.createContainer(projectConfig)
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

	public async destroyContainer(projectGroup: ProjectGroup, slug: string): Promise<void> {
		const groupState = this.getProjectGroupState(projectGroup)
		const existing = groupState.getContainer(slug)
		if (existing) {
			const existingAwaited = await existing
			existingAwaited.cleanups.forEach(it => it())
			existingAwaited.container.project.alias?.forEach(it => groupState.removeAlias(it))
			groupState.removeContainer(slug)
		}
		process.nextTick(() => {
			if (global.gc) {
				global.gc()
			}
		})
	}

	private getProjectGroupState(projectGroup: ProjectGroup): ProjectGroupState {
		let groupState = this.projectGroupStates.get(projectGroup)
		if (!groupState) {
			groupState = new ProjectGroupState()
			this.projectGroupStates.set(projectGroup, new ProjectGroupState())
		}
		return groupState
	}
}
