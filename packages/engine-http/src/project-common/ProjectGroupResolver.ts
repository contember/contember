import { Request } from 'koa'
import { ProjectGroupContainer } from '../ProjectGroupContainer'

export interface ProjectGroupResolver {
	resolveContainer({ request }: { request: Request }): Promise<ProjectGroupContainer>
}
