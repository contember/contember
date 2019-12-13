import { KoaMiddleware } from '../../core/koa'
import { KoaRequestState } from '../../core/koa'
import { ProjectResolveMiddlewareFactory } from '../project-common'
import Project from '../../config/Project'

type InputState = StageResolveMiddlewareFactory.KoaState & ProjectResolveMiddlewareFactory.KoaState & KoaRequestState

class StageResolveMiddlewareFactory {
	public create(): KoaMiddleware<InputState> {
		const stageResolve: KoaMiddleware<InputState> = async (ctx, next) => {
			const project = ctx.state.projectContainer.project

			const stage = project.stages.find(stage => stage.slug === ctx.state.params.stageSlug)

			if (stage === undefined) {
				return ctx.throw(404, `Stage ${ctx.state.params.stageSlug} NOT found`)
			}
			ctx.state.stage = stage
			await next()
		}
		return stageResolve
	}
}

namespace StageResolveMiddlewareFactory {
	export interface KoaState {
		stage: Project.Stage
	}
}

export { StageResolveMiddlewareFactory }
