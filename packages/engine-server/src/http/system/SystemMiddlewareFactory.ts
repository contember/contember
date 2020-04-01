import Koa from 'koa'
import koaCompose from 'koa-compose'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { KoaContext, route } from '../../core/koa'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { ProjectMemberMiddlewareFactory, ProjectResolveMiddlewareFactory } from '../project-common'

export class SystemMiddlewareFactory {
	constructor(
		private readonly projectResolveMiddlewareFactory: ProjectResolveMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
		private readonly projectMemberMiddlewareFactory: ProjectMemberMiddlewareFactory,
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
