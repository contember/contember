import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import { ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-tenant-api'
import { GraphQLError, GraphQLFormattedError } from 'graphql'
import { ApolloError } from 'apollo-server-errors'
import { extractOriginalError } from '../../core/graphql/errorExtract'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly resolverContextFactory: ResolverContextFactory,
		private readonly errorFormatter: (error: GraphQLError) => GraphQLFormattedError,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			introspection: true,
			tracing: true,
			resolvers: this.resolvers as Config['resolvers'],
			formatError: err => {
				if (err instanceof ApolloError) {
					return err
				}
				const originalError = extractOriginalError(err)
				if (originalError instanceof GraphQLError) {
					return err
				}
				return this.errorFormatter(err)
			},
			context: ({ ctx }: { ctx: AuthMiddlewareFactory.ContextWithAuth }): ResolverContext => {
				return this.resolverContextFactory.create(ctx.state.authResult)
			},
		})
	}
}

export { TenantApolloServerFactory }
