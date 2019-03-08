import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import typeDefs from '../system-api/schema/system.graphql'
import ResolverContext from '../system-api/resolvers/ResolverContext'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import Authorizator from '../core/authorization/Authorizator'
import Identity from '../common/auth/Identity'
import { ApolloError } from 'apollo-server-errors'
import SystemExecutionContainer from '../system-api/SystemExecutionContainer'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import { KoaContext } from '../core/koa/types'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import ProjectResolveMiddlewareFactory from './ProjectResolveMiddlewareFactory'

class SystemApolloServerFactory {
	constructor(
		private readonly resolvers: Config['resolvers'],
		private readonly authorizator: Authorizator<Identity>,
		private readonly executionContainerFactory: SystemExecutionContainer.Factory
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers,
			extensions: [() => new ErrorHandlerExtension()],
			formatError: (error: any) => {
				if (error instanceof AuthenticationError) {
					return { message: error.message, locations: undefined, path: undefined }
				}
				if (error instanceof ApolloError) {
					return error
				}
				console.error(error.originalError || error)
				return { message: 'Internal server error', locations: undefined, path: undefined }
			},
			context: ({
				ctx,
			}: {
				ctx: KoaContext<DatabaseTransactionMiddlewareFactory.KoaState
					& AuthMiddlewareFactory.KoaState
					& ProjectMemberMiddlewareFactory.KoaState
					& ProjectResolveMiddlewareFactory.KoaState
				>
			}): ResolverContext => {
				return new ResolverContext(
					new Identity.StaticIdentity(ctx.state.authResult.identityId, ctx.state.authResult.roles, {
						[ctx.state.projectContainer.project.uuid]: ctx.state.projectRoles
					}),
					ctx.state.projectVariables,
					this.authorizator,
					this.executionContainerFactory.create(ctx.state.db),
					ctx.state.planRollback
				)
			},
		})
	}
}

export default SystemApolloServerFactory
