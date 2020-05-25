import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import Koa from 'koa'
import { compose, KoaContext, KoaMiddleware, route } from '../../core/koa'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { Client } from '@contember/database'
import { formatSchemaName } from '@contember/engine-system-api'
import { ProjectMemberMiddlewareFactory, ProjectResolveMiddlewareFactory } from '../project-common'
import { StageResolveMiddlewareFactory } from './StageResolveMiddlewareFactory'
import { NotModifiedMiddlewareFactory } from './NotModifiedMiddlewareFactory'
import { createModuleInfoMiddleware } from '../common/ModuleInfoMiddleware'

class ContentMiddlewareFactory {
	constructor(
		private readonly projectFindMiddlewareFactory: ProjectResolveMiddlewareFactory,
		private readonly stageFindMiddlewareFactory: StageResolveMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
		private readonly projectMemberMiddlewareFactory: ProjectMemberMiddlewareFactory,
		private readonly notModifiedMiddlewareFactory: NotModifiedMiddlewareFactory,
	) {}

	create(): Koa.Middleware {
		const assignDb: KoaMiddleware<ProjectResolveMiddlewareFactory.KoaState &
			StageResolveMiddlewareFactory.KoaState & { db: Client }> = (ctx, next) => {
			const projectContainer = ctx.state.projectContainer
			const stage = ctx.state.stage
			ctx.state.db = projectContainer.connection.createClient(formatSchemaName(stage))
			return next()
		}
		const contentApollo: KoaMiddleware<ProjectResolveMiddlewareFactory.KoaState &
			StageResolveMiddlewareFactory.KoaState> = async (ctx, next) => {
			await ctx.state.projectContainer.contentApolloMiddlewareFactory.create(ctx.state.stage)(
				ctx as KoaContext<any>,
				next,
			)
		}

		return route(
			'/content/:projectSlug/:stageSlug$',
			compose([
				createModuleInfoMiddleware('content'),
				corsMiddleware(),
				bodyParser(),
				this.authMiddlewareFactory.create(),
				this.projectFindMiddlewareFactory.create(),
				this.stageFindMiddlewareFactory.create(),
				this.notModifiedMiddlewareFactory.create(),
				this.projectMemberMiddlewareFactory.create(),
				assignDb,
				contentApollo,
			]),
		)
	}
}

export { ContentMiddlewareFactory }
