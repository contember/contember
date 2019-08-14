import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import Koa from 'koa'
import { route } from '../core/koa/router'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import PlaygroundMiddlewareFactory from './PlaygroundMiddlewareFactory'
import Client from '../core/database/Client'
import { formatSchemaName } from '../system-api/model/helpers/stageHelpers'
import ProjectResolveMiddlewareFactory from './ProjectResolveMiddlewareFactory'
import StageResolveMiddlewareFactory from './StageResolveMiddlewareFactory'
import { KoaContext, KoaMiddleware } from '../core/koa/types'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import SetupSystemVariablesMiddlewareFactory from './SetupSystemVariablesMiddlewareFactory'
import { compose } from '../core/koa/compose'

class ContentMiddlewareFactory {
	constructor(
		private readonly projectFindMiddlewareFactory: ProjectResolveMiddlewareFactory,
		private readonly stageFindMiddlewareFactory: StageResolveMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
		private readonly projectMemberMiddlewareFactory: ProjectMemberMiddlewareFactory,
		private readonly databaseTransactionMiddlewareFactory: DatabaseTransactionMiddlewareFactory,
		private readonly setupSystemVariablesMiddlewareFactory: SetupSystemVariablesMiddlewareFactory,
	) {}

	create(): Koa.Middleware {
		const assignDb: KoaMiddleware<
			ProjectResolveMiddlewareFactory.KoaState & StageResolveMiddlewareFactory.KoaState & { db: Client }
		> = (ctx, next) => {
			const projectContainer = ctx.state.projectContainer
			const stage = ctx.state.stage
			ctx.state.db = projectContainer.connection.createClient(formatSchemaName(stage))
			return next()
		}
		const contentApollo: KoaMiddleware<
			ProjectResolveMiddlewareFactory.KoaState & StageResolveMiddlewareFactory.KoaState
		> = async (ctx, next) => {
			await ctx.state.projectContainer.contentApolloMiddlewareFactory.create(ctx.state.stage)(
				ctx as KoaContext<any>,
				next,
			)
		}

		return route(
			'/content/:projectSlug/:stageSlug$',
			compose([
				new PlaygroundMiddlewareFactory().create(),
				corsMiddleware(),
				bodyParser(),
				this.authMiddlewareFactory.create(),
				this.projectFindMiddlewareFactory.create(),
				this.stageFindMiddlewareFactory.create(),
				this.projectMemberMiddlewareFactory.create(),
				assignDb,
				this.databaseTransactionMiddlewareFactory.create(),
				this.setupSystemVariablesMiddlewareFactory.create(),
				contentApollo,
			]),
		)
	}
}

export default ContentMiddlewareFactory
