import { KoaMiddleware } from '../koa'
import { ProjectResolveMiddlewareState } from './ProjectResolveMiddlewareFactory'
import { AuthMiddlewareState, TimerMiddlewareState } from '../common'
import { ProjectGroupState } from './ProjectGroupMiddlewareFactory'
import { HttpError } from '../common/HttpError'

type InputKoaState =
	& AuthMiddlewareState
	& ProjectResolveMiddlewareState
	& TimerMiddlewareState
	& ProjectGroupState

type KoaState =
	& InputKoaState
	& ProjectMemberMiddlewareState

export interface ProjectMemberMiddlewareState {
	projectMemberships: readonly { role: string; variables: readonly { name: string; values: readonly string[] }[] }[]
}

export class ProjectMemberMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
	) {
	}

	public create(): KoaMiddleware<KoaState> {
		const projectMember: KoaMiddleware<KoaState> = async (ctx, next) => {
			const project = ctx.state.project
			const tenantContainer = ctx.state.projectGroupContainer.tenantContainer
			const projectMemberships = await ctx.state.timer('MembershipFetch', () =>
				tenantContainer.projectMemberManager.getProjectMemberships(
					tenantContainer.databaseContext,
					{ slug: project.slug },
					{
						id: ctx.state.authResult.identityId,
						roles: ctx.state.authResult.roles,
					},
					undefined,
				),
			)
			if (projectMemberships.length === 0) {
				throw this.debug
					? new HttpError(`You are not allowed to access project ${project.slug}`, 403)
					: new HttpError(`Project ${project.slug} NOT found`, 404)
			}
			ctx.state.projectMemberships = projectMemberships
			await next()
		}
		return projectMember
	}
}
