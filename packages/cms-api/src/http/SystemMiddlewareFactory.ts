import Koa from 'koa'
import koaCompose from 'koa-compose'
import { route } from '../core/koa/router'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import KnexWrapper from '../core/knex/KnexWrapper'
import ProjectResolveMiddlewareFactory from './ProjectResolveMiddlewareFactory'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { KoaContext } from '../core/koa/types'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import SetupSystemVariablesMiddlewareFactory from './SetupSystemVariablesMiddlewareFactory'

export default class SystemMiddlewareFactory {
	constructor(
		private readonly projectResolveMiddlewareFactory: ProjectResolveMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
		private readonly projectMemberMiddlewareFactory: ProjectMemberMiddlewareFactory,
		private readonly databaseTransactionMiddlewareFactory: DatabaseTransactionMiddlewareFactory,
		private readonly setupSystemVariablesMiddlewareFactory: SetupSystemVariablesMiddlewareFactory
	) {}

	create(): Koa.Middleware {
		return route(
			'/system/:projectSlug$',
			koaCompose<KoaContext<any>>([
				corsMiddleware(),
				bodyParser(),
				this.authMiddlewareFactory.create(),
				this.projectResolveMiddlewareFactory.create(),
				this.projectMemberMiddlewareFactory.create(),
				(ctx: KoaContext<ProjectResolveMiddlewareFactory.KoaState & { db: KnexWrapper }>, next) => {
					const projectContainer = ctx.state.projectContainer
					const knex = projectContainer.knexConnection
					ctx.state.db = new KnexWrapper(knex, 'system')
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
					next
				) => {
					const projectContainer = ctx.state.projectContainer
					const serverFactory = projectContainer.systemApolloServerFactory
					const server = serverFactory.create()
					await graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next)
				},
			])
		)
	}
}
