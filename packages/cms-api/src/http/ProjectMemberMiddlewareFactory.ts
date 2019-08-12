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
			const [projectRoles, projectVariables] = await Promise.all([
				this.projectMemberManager.getProjectRoles(project.id, ctx.state.authResult.identityId),
				this.projectMemberManager.getProjectVariables(project.id, ctx.state.authResult.identityId),
			])
			ctx.state.projectRoles = projectRoles.roles
			ctx.state.projectVariables = projectVariables
			await next()
		}
		return projectMember
	}
}

namespace ProjectMemberMiddlewareFactory {
	export interface KoaState {
		projectRoles: string[]
		projectVariables: { [name: string]: string[] }
	}
}

export default ProjectMemberMiddlewareFactory
