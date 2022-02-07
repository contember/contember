import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectContainer } from '../ProjectContainer'
import { ProjectConfig } from '../config'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { ProjectGroupState } from './ProjectGroupMiddlewareFactory'

type InputKoaState =
	& KoaRequestState
	& AuthMiddlewareState
	& ProjectGroupState

type KoaState =
	& InputKoaState
	& ProjectResolveMiddlewareState

export interface ProjectResolveMiddlewareState {
	project: ProjectConfig
	projectContainer: ProjectContainer
}

export class ProjectResolveMiddlewareFactory {
	constructor(
		private readonly errorFactory: ErrorFactory,
	) {
	}

	public create(): KoaMiddleware<KoaState> {
		const projectResolve: KoaMiddleware<KoaState> = async (ctx, next) => {
			const projectSlug = ctx.state.params.projectSlug
			const projectContainer = await ctx.state.projectGroupContainer.projectContainerResolver.getProjectContainer(projectSlug, true)

			if (projectContainer === undefined) {
				return this.errorFactory.createError(ctx, `Project ${projectSlug} NOT found`, 404)
			}
			ctx.state.projectContainer = projectContainer
			ctx.state.project = projectContainer.project
			await next()
		}
		return projectResolve

	}
}
