import { Authorizator } from '@contember/authorization'
import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ResolverContext, Schema, SystemExecutionContainer, typeDefs } from '@contember/engine-system-api'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { Identity } from '@contember/engine-common'
import { ApolloError } from 'apollo-server-errors'
import ErrorHandlerExtension from '../../core/graphql/ErrorHandlerExtension'
import { KoaContext } from '../../core/koa'
import {
	DatabaseTransactionMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
} from '../project-common'
import { flattenVariables } from '@contember/engine-content-api'

class SystemApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly authorizator: Authorizator<Identity>,
		private readonly executionContainerFactory: SystemExecutionContainer.Factory,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
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
				ctx: KoaContext<
					DatabaseTransactionMiddlewareFactory.KoaState &
						AuthMiddlewareFactory.KoaState &
						ProjectMemberMiddlewareFactory.KoaState &
						ProjectResolveMiddlewareFactory.KoaState
				>
			}): ResolverContext => {
				return new ResolverContext(
					new Identity.StaticIdentity(ctx.state.authResult.identityId, ctx.state.authResult.roles, {
						[ctx.state.projectContainer.project.slug]: ctx.state.projectMemberships.map(it => it.role),
					}),
					flattenVariables(ctx.state.projectMemberships),
					this.authorizator,
					this.executionContainerFactory.create(ctx.state.db),
					ctx.state.planRollback,
				)
			},
		})
	}
}

export { SystemApolloServerFactory }
