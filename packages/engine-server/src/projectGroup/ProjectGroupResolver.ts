import { ProjectGroupContainer, ProjectGroupResolver as ProjectGroupResolverInterface } from '@contember/engine-http'

export class ProjectGroupResolver implements ProjectGroupResolverInterface {
	constructor(
		private readonly projectGroupContainer: ProjectGroupContainer,
	) {
	}

	resolveContainer(): Promise<ProjectGroupContainer> {
		return Promise.resolve(this.projectGroupContainer)
	}
}
