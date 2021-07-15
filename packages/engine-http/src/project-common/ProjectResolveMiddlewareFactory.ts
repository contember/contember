import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectContainer } from '../ProjectContainer'
import { ProjectConfig } from '../ProjectConfig'
import { ErrorResponseMiddlewareState } from '../common'
import { ProjectContainerResolverState } from '../services'
import { ProvidersState } from '../services/ProvidersState'

type KoaState = ProjectResolveMiddlewareState &
	KoaRequestState &
	ErrorResponseMiddlewareState &
	ProvidersState &
	ProjectContainerResolverState

export const createProjectResolveMiddleware = () => {
	const projectResolve: KoaMiddleware<KoaState> = async (ctx, next) => {
		const projectSlug = ctx.state.params.projectSlug
		const projectContainer = await ctx.state.projectContainerResolver(projectSlug, true)

		if (projectContainer === undefined) {
			return ctx.state.fail.projectNotFound(projectSlug)
		}
		ctx.state.projectContainer = projectContainer
		ctx.state.project = projectContainer.project
		await next()
	}
	return projectResolve
}

export interface ProjectResolveMiddlewareState {
	project: ProjectConfig
	projectContainer: ProjectContainer
}
