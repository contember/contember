import { KoaContext, KoaMiddleware, KoaRequestState } from '../../core/koa'
import { ProjectContainer, ProjectContainerResolver } from '../../ProjectContainer'

type InputState = ProjectResolveMiddlewareFactory.KoaState & KoaRequestState

class ProjectResolveMiddlewareFactory {
	constructor(private readonly projectContainerResolver: ProjectContainerResolver) {}

	public create(): KoaMiddleware<InputState> {
		const projectResolve: KoaMiddleware<InputState> = async (ctx, next) => {
			const projectSlug = ctx.state.params.projectSlug
			const projectContainer = this.projectContainerResolver(projectSlug)

			if (projectContainer === undefined) {
				return throwProjectNotFound(ctx, projectSlug)
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

export const throwProjectNotFound = (ctx: KoaContext<any>, projectSlug: string) =>
	ctx.throw(404, `Project ${projectSlug} NOT found`)

export { ProjectResolveMiddlewareFactory }
