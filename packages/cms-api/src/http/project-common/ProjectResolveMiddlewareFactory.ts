import { KoaContext, KoaMiddleware, KoaRequestState } from '../../core/koa'
import { ProjectContainer, ProjectContainerResolver } from '../../ProjectContainer'
import { ErrorResponseMiddlewareState } from '../ErrorResponseMiddlewareFactory'

type InputState = ProjectResolveMiddlewareFactory.KoaState & KoaRequestState & ErrorResponseMiddlewareState

class ProjectResolveMiddlewareFactory {
	constructor(private readonly projectContainerResolver: ProjectContainerResolver) {}

	public create(): KoaMiddleware<InputState> {
		const projectResolve: KoaMiddleware<InputState> = async (ctx, next) => {
			const projectSlug = ctx.state.params.projectSlug
			const projectContainer = this.projectContainerResolver(projectSlug)

			if (projectContainer === undefined) {
				return ctx.state.fail.projectNotFound(projectSlug)
			}
			ctx.state.projectContainer = projectContainer
			await next()
		}
		return projectResolve
	}
}

namespace ProjectResolveMiddlewareFactory {
	export interface KoaState {
		projectContainer: ProjectContainer
	}
}

export { ProjectResolveMiddlewareFactory }
