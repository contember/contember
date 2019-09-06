import { KoaMiddleware } from '../core/koa/types'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import ProjectResolveMiddlewareFactory from './ProjectResolveMiddlewareFactory'
import { ProjectMemberManager } from '@contember/engine-tenant-api'

type InputState = ProjectMemberMiddlewareFactory.KoaState &
	AuthMiddlewareFactory.KoaState &
	ProjectResolveMiddlewareFactory.KoaState
class ProjectMemberMiddlewareFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(): KoaMiddleware<InputState> {
		const projectMember: KoaMiddleware<InputState> = async (ctx, next) => {
			const project = ctx.state.projectContainer.project
			const projectMemberships = await this.projectMemberManager.getProjectBySlugMemberships(
				project.slug,
				ctx.state.authResult.identityId,
			)
			ctx.state.projectMemberships = projectMemberships
			await next()
		}
		return projectMember
	}
}

namespace ProjectMemberMiddlewareFactory {
	export interface KoaState {
		projectMemberships: readonly { role: string; variables: readonly { name: string, values: readonly string[] }[] }[]
	}
}

export default ProjectMemberMiddlewareFactory
