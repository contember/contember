import { Request } from 'koa'
import { ProjectGroupContainer } from '../ProjectGroupContainer.js'

export interface ProjectGroupResolver {
	resolveContainer({ request }: { request: Request }): Promise<ProjectGroupContainer>
}
