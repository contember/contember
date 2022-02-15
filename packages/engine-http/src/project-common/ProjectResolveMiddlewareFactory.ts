import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectContainer } from '../ProjectContainer'
import { ProjectConfig } from '../config'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { ProjectGroupState } from './ProjectGroupMiddlewareFactory'
import { HttpError } from '../common/HttpError'

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
	public create(): KoaMiddleware<KoaState> {
		const projectResolve: KoaMiddleware<KoaState> = async (ctx, next) => {
			const projectSlug = ctx.state.params.projectSlug
			const projectContainer = await ctx.state.projectGroupContainer.projectContainerResolver.getProjectContainer(projectSlug, true)

			if (projectContainer === undefined) {
				throw new HttpError(`Project ${projectSlug} NOT found`, 404)
			}
			ctx.state.projectContainer = projectContainer
			ctx.state.project = projectContainer.project
			await next()
		}
		return projectResolve

	}
}
