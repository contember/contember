import { ProjectContainerFactory } from './ProjectContainer'
import { ProjectConfigResolver, ProjectContainer } from '@contember/engine-http'
import { ProjectManager, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectGroup } from '@contember/engine-tenant-api'

type ContainerWithMeta = { container: ProjectContainer; cleanups: (() => void)[]; timestamp: Date }

class ProjectGroupState {
	private containers = new Map<string, ContainerWithMeta>()
	private aliasMapping = new Map<string, string>()

	public resolveAlias(slug: string): string | undefined {
		return this.aliasMapping.get(slug)
	}

	public setAlias(slug: string, alias: string): void {
		this.aliasMapping.set(alias, slug)
	}

	public removeAlias(alias: string): void {
		this.aliasMapping.delete(alias)
	}

	public getContainer(slug: string): ContainerWithMeta | undefined {
		return this.containers.get(slug)
	}

	public setContainer(slug: string, container: ContainerWithMeta): void {
		this.containers.set(slug, container)
	}

	public removeContainer(slug: string): void {
		this.containers.delete(slug)
	}
}


export class ProjectContainerResolver {
	private projectGroupStates = new WeakMap<ProjectGroup, ProjectGroupState>()

	public readonly onCreate: ((container: ProjectContainer) => void | (() => void))[] = []

	constructor(
		private projectContainerFactory: ProjectContainerFactory,
		private projectConfigResolver: ProjectConfigResolver,
		private projectManager: ProjectManager,
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
			const state = await this.projectManager.getProjectState(projectGroup.database, slug, existing.timestamp)
			if (state === 'valid') {
				return existing.container
			}
			this.destroyContainer(projectGroup, slug)
			if (state === 'not_found') {
				return undefined
			}
		}
		const project = await this.projectManager.getProjectWithSecretsBySlug(projectGroup.database, slug, alias)
		if (!project) {
			return undefined
		}
		const container = this.createProjectContainer(projectGroup, project)
		if (slug !== project.slug) {
			groupState.setAlias(project.slug, slug)
		}
		return container
	}

	public createProjectContainer(projectGroup: ProjectGroup, project: ProjectWithSecrets): ProjectContainer {
		const projectConfig = this.projectConfigResolver(project.slug, project.config, project.secrets)
		const groupState = this.getProjectGroupState(projectGroup)
		const existing = groupState.getContainer(project.slug)
		if (existing) {
			return existing.container
		}
		const projectContainer = this.projectContainerFactory.createContainer(projectConfig)
		const cleanups = this.onCreate.map(it => it(projectContainer) || (() => null))
		groupState.setContainer(project.slug, {
			container: projectContainer,
			cleanups,
			timestamp: project.updatedAt,
		})
		return projectContainer
	}

	public destroyContainer(projectGroup: ProjectGroup, slug: string): void {
		const groupState = this.getProjectGroupState(projectGroup)
		const existing = groupState.getContainer(slug)
		if (existing) {
			existing.cleanups.forEach(it => it())
			existing.container.project.alias?.forEach(it => groupState.removeAlias(it))
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
