import { ProjectGroupContainer } from './ProjectGroupContainer'
import { Request } from 'koa'

export interface ProjectGroupResolver {
	resolveContainer({ request }: { request: Request }): Promise<ProjectGroupContainer>
}

export class SingleProjectGroupResolver {
	constructor(
		private readonly projectGroupContainer: ProjectGroupContainer,
	) {
	}

	resolveContainer(): Promise<ProjectGroupContainer> {
		return Promise.resolve(this.projectGroupContainer)
	}
}
