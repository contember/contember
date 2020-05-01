import { KoaMiddleware } from '../../core/koa'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { ProjectResolveMiddlewareFactory } from './ProjectResolveMiddlewareFactory'
import { ProjectMemberManager } from '@contember/engine-tenant-api'
import { ErrorResponseMiddlewareState } from '../ErrorResponseMiddlewareFactory'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'

type InputState = ProjectMemberMiddlewareFactory.KoaState &
	AuthMiddlewareFactory.KoaState &
	ProjectResolveMiddlewareFactory.KoaState &
	ErrorResponseMiddlewareState &
	TimerMiddlewareFactory.KoaState
class ProjectMemberMiddlewareFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(): KoaMiddleware<InputState> {
		const projectMember: KoaMiddleware<InputState> = async (ctx, next) => {
			const project = ctx.state.projectContainer.project
			const projectMemberships = await ctx.state.timer('MembershipFetch', () =>
				this.projectMemberManager.getProjectBySlugMemberships(project.slug, {
					id: ctx.state.authResult.identityId,
					roles: ctx.state.authResult.roles,
				}),
			)
			if (projectMemberships.length === 0) {
				return ctx.state.fail.projectForbidden(project.slug)
			}
			ctx.state.projectMemberships = projectMemberships
			await next()
		}
		return projectMember
	}
}

namespace ProjectMemberMiddlewareFactory {
	export interface KoaState {
		projectMemberships: readonly { role: string; variables: readonly { name: string; values: readonly string[] }[] }[]
	}
}

export { ProjectMemberMiddlewareFactory }
