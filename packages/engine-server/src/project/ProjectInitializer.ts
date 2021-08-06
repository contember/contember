import { Logger } from '@contember/engine-common'
import { ProjectInitializer as ProjectInitializerInterface, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectContainerResolver } from './ProjectContainerResolver'
import { ProjectInitializer as SystemProjectInitializer } from '@contember/engine-system-api'

export class ProjectInitializer implements ProjectInitializerInterface {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly systemProjectInitializer: SystemProjectInitializer,
	) {}

	async initializeProject(project: ProjectWithSecrets) {
		const container = await this.projectContainerResolver.createProjectContainer(project)
		if (!container) {
			throw new Error('Should not happen')
		}
		const log: string[] = []
		try {
			await this.systemProjectInitializer.initialize(
				container.systemDatabaseContextFactory,
				container.project,
				new Logger(log.push),
			)
		} catch (e) {
			await this.projectContainerResolver.destroyContainer(project.slug)
			throw e
		}
		return { log }
	}
}

export class ProjectInitializerProxy implements ProjectInitializerInterface {
	private initializer: ProjectInitializerInterface | undefined = undefined

	setInitializer(initializer: ProjectInitializerInterface): void {
		this.initializer = initializer
	}

	initializeProject(project: ProjectWithSecrets) {
		if (!this.initializer) {
			throw new Error('Initializer is not set')
		}
		return this.initializer.initializeProject(project)
	}
}
