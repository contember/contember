import { ProjectInitializer as ProjectInitializerInterface, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectContainerResolver } from './ProjectContainerResolver'
import { Logger } from '@contember/logger'

export class ProjectInitializer implements ProjectInitializerInterface {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
	) {}

	async initializeProject(project: ProjectWithSecrets, logger: Logger) {
		await this.projectContainerResolver.createProjectContainer(project)
	}
}

export class ProjectInitializerProxy implements ProjectInitializerInterface {
	private initializer: ProjectInitializerInterface | undefined = undefined

	setInitializer(initializer: ProjectInitializerInterface): void {
		this.initializer = initializer
	}

	initializeProject(project: ProjectWithSecrets, logger: Logger) {
		if (!this.initializer) {
			throw new Error('Initializer is not set')
		}
		return this.initializer.initializeProject(project, logger)
	}
}
