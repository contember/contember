import { KoaMiddleware, KoaRequestState } from '../../core/koa'
import { ProjectContainer, ProjectContainerResolver } from '../../ProjectContainer'

type InputState = ProjectResolveMiddlewareFactory.KoaState & KoaRequestState

class ProjectResolveMiddlewareFactory {
	constructor(private readonly projectContainerResolver: ProjectContainerResolver) {}

	public create(): KoaMiddleware<InputState> {
		const projectResolve: KoaMiddleware<InputState> = async (ctx, next) => {
			const projectContainer = this.projectContainerResolver(ctx.state.params.projectSlug)

			if (projectContainer === undefined) {
				return ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
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
