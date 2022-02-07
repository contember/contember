import { KoaMiddleware } from '../koa'
import { ProjectGroupState } from '../project-common'

type KoaState =
	& ProjectGroupState

export class SystemGraphQLMiddlewareFactory {
	create(): KoaMiddleware<KoaState> {
		const systemServer: KoaMiddleware<KoaState> = async (ctx, next) => {
			return await ctx.state.projectGroupContainer.systemGraphQLMiddleware(ctx, next)
		}
		return systemServer
	}
}
