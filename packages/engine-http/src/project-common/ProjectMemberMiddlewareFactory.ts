import { KoaMiddleware } from '../koa'
import { ProjectResolveMiddlewareState } from './ProjectResolveMiddlewareFactory'
import { AuthMiddlewareState, ErrorResponseMiddlewareState, TimerMiddlewareState } from '../common'
import { ProjectMemberManagerState } from '../services'

type KoaState = ProjectMemberMiddlewareState &
	ProjectMemberManagerState &
	AuthMiddlewareState &
	ProjectResolveMiddlewareState &
	ErrorResponseMiddlewareState &
	TimerMiddlewareState

export const createProjectMemberMiddleware = (): KoaMiddleware<KoaState> => {
	const projectMember: KoaMiddleware<KoaState> = async (ctx, next) => {
		const project = ctx.state.project
		const projectMemberships = await ctx.state.timer('MembershipFetch', () =>
			ctx.state.projectMemberManager.getProjectBySlugMemberships(project.slug, {
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

export interface ProjectMemberMiddlewareState {
	projectMemberships: readonly { role: string; variables: readonly { name: string; values: readonly string[] }[] }[]
}
