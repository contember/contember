import { KoaMiddleware } from '../core/koa/types'
import { ProjectContainer } from '../CompositionRoot'
import { KoaRequestState } from '../core/koa/router'

type InputState = ProjectResolveMiddlewareFactory.KoaState & KoaRequestState

class ProjectResolveMiddlewareFactory {
	constructor(private projectContainers: ProjectContainer[]) {
	}

	public create(): KoaMiddleware<InputState> {
		const projectResolve: KoaMiddleware<InputState> = async (ctx, next) => {
			const projectContainer = this.projectContainers.find(projectContainer => {
				return projectContainer.project.slug === ctx.state.params.projectSlug
			})

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

export default ProjectResolveMiddlewareFactory
