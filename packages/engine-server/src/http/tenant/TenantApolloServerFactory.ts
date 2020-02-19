import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-tenant-api'
import { GraphQLError } from 'graphql'
import { ApolloError } from 'apollo-server-errors'
import { ApolloError as ApolloCoreError } from 'apollo-server-core'
import { extractOriginalError } from '../../core/graphql/errorExtract'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly resolverContextFactory: ResolverContextFactory,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			introspection: true,
			tracing: true,
			resolvers: this.resolvers as Config['resolvers'],
			formatError: err => {
				if (err instanceof AuthenticationError) {
					return { message: err.message, locations: undefined, path: undefined }
				}
				if (err instanceof ApolloError) {
					return err
				}
				const originalError = extractOriginalError(err)
				if (
					originalError instanceof GraphQLError ||
					originalError instanceof ApolloError ||
					originalError instanceof ApolloCoreError
				) {
					return err
				}
				console.error(originalError || err)
				return { message: 'Internal server error', locations: undefined, path: undefined }
			},
			context: ({ ctx }: { ctx: AuthMiddlewareFactory.ContextWithAuth }): ResolverContext => {
				return this.resolverContextFactory.create(ctx.state.authResult)
			},
		})
	}
}

export { TenantApolloServerFactory }
