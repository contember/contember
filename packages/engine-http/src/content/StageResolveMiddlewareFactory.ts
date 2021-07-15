import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectResolveMiddlewareState } from '../project-common'
import { StageConfig } from '../ProjectConfig'

type KoaState = StageResolveMiddlewareState & ProjectResolveMiddlewareState & KoaRequestState

export const createStageResolveMiddleware = (): KoaMiddleware<KoaState> => {
	const stageResolve: KoaMiddleware<KoaState> = (ctx, next) => {
		const project = ctx.state.projectContainer.project

		const stage = project.stages.find(stage => stage.slug === ctx.state.params.stageSlug)

		if (stage === undefined) {
			return ctx.throw(404, `Stage ${ctx.state.params.stageSlug} NOT found`)
		}
		ctx.state.stage = stage
		return next()
	}
	return stageResolve
}

export interface StageResolveMiddlewareState {
	stage: StageConfig
}
