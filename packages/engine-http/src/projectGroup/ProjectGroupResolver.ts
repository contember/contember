import { ProjectGroupContainer } from './ProjectGroupContainer'
import { IncomingMessage } from 'http'

export interface ProjectGroupResolver {
	resolveContainer({ request }: { request: IncomingMessage }): Promise<ProjectGroupContainer>
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
