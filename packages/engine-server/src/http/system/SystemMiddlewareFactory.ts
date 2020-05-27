import Koa from 'koa'
import koaCompose from 'koa-compose'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { Client } from '@contember/database'
import { KoaContext, route } from '../../core/koa'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import {
	SetupSystemVariablesMiddlewareFactory,
	DatabaseTransactionMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
} from '../project-common'
import { createModuleInfoMiddleware } from '../common/ModuleInfoMiddleware'

export class SystemMiddlewareFactory {
	constructor(
		private readonly projectResolveMiddlewareFactory: ProjectResolveMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
		private readonly projectMemberMiddlewareFactory: ProjectMemberMiddlewareFactory,
		private readonly databaseTransactionMiddlewareFactory: DatabaseTransactionMiddlewareFactory,
		private readonly setupSystemVariablesMiddlewareFactory: SetupSystemVariablesMiddlewareFactory,
	) {}

	create(): Koa.Middleware {
		return route(
			'/system/:projectSlug$',
			koaCompose<KoaContext<any>>([
				createModuleInfoMiddleware('system'),
				corsMiddleware(),
				bodyParser(),
				this.authMiddlewareFactory.create(),
				this.projectResolveMiddlewareFactory.create(),
				this.projectMemberMiddlewareFactory.create(),
				(ctx: KoaContext<ProjectResolveMiddlewareFactory.KoaState & { db: Client }>, next) => {
					const projectContainer = ctx.state.projectContainer
					ctx.state.db = projectContainer.connection.createClient('system', { module: 'system' })
					return next()
				},
				this.databaseTransactionMiddlewareFactory.create(),
				this.setupSystemVariablesMiddlewareFactory.create(),

				async (
					ctx: KoaContext<
						AuthMiddlewareFactory.KoaState &
							ProjectResolveMiddlewareFactory.KoaState &
							ProjectMemberMiddlewareFactory.KoaState
					>,
					next,
				) => {
					const projectContainer = ctx.state.projectContainer
					const serverFactory = projectContainer.systemApolloServerFactory
					const server = serverFactory.create()
					await graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next)
				},
			]),
		)
	}
}
