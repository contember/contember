import { KoaMiddleware } from '../koa'
import { ProjectGroupState } from '../project-common'

type KoaState =
	& ProjectGroupState

export class TenantGraphQLMiddlewareFactory {
	create(): KoaMiddleware<KoaState> {
		const tenantServer: KoaMiddleware<KoaState> = async (ctx, next) => {
			return await ctx.state.projectGroupContainer.tenantGraphQLMiddleware(ctx, next)
		}
		return tenantServer
	}
}
