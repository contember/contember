import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectResolveMiddlewareState } from '../project-common'
import { StageConfig } from '../config'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { Stage, StageBySlugQuery, unnamedIdentity } from '@contember/engine-system-api'

type InputKoaState =
	& ProjectResolveMiddlewareState
	& KoaRequestState
	& AuthMiddlewareState

type KoaState =
	& InputKoaState
	& StageResolveMiddlewareState

export interface StageResolveMiddlewareState {
	stage: Stage
}

export class StageResolveMiddlewareFactory {
	constructor(
		private errorFactory: ErrorFactory,
	) {
	}

	public create(): KoaMiddleware<KoaState> {
		const stageResolve: KoaMiddleware<KoaState> = async (ctx, next) => {
			const systemDb = ctx.state.projectContainer.systemDatabaseContextFactory.create(unnamedIdentity)
			const stage = await systemDb.queryHandler.fetch(new StageBySlugQuery(ctx.state.params.stageSlug))
			if (!stage) {
				return this.errorFactory.createError(ctx, `Stage ${ctx.state.params.stageSlug} NOT found`, 404)
			}
			ctx.state.stage = stage
			return next()
		}
		return stageResolve
	}
}
