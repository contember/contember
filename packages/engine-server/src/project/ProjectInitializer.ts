import { ProjectInitializer as ProjectInitializerInterface, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { ProjectContainerResolver } from './ProjectContainerResolver'

export class ProjectInitializer implements ProjectInitializerInterface {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
	) {}

	async initializeProject(project: ProjectWithSecrets) {
		await this.projectContainerResolver.createProjectContainer(project)
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
