import { Config } from 'apollo-server-core'
import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa'
import { ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-tenant-api'
import { AuthMiddlewareState, GraphqlInfoProviderPlugin, GraphQLInfoState } from '../common'
import { ErrorContextProvider, ErrorHandlerExtension, ErrorLogger } from '../graphql/ErrorHandlerExtension'
import { KoaContext } from '../koa'

type ExtendedGraphqlContext = ResolverContext & {
	errorContextProvider: ErrorContextProvider
	koaContext: InputKoaContext
}

type InputKoaContext = KoaContext<AuthMiddlewareState & GraphQLInfoState>

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly resolverContextFactory: ResolverContextFactory,
		private readonly errorLogger: ErrorLogger,
	) {}

	create(): ApolloServer {
		const schema = makeExecutableSchema({
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
			resolverValidationOptions: { requireResolversForResolveType: false },
		})
		return new ApolloServer({
			schema,
			introspection: true,
			tracing: true,
			extensions: [() => new ErrorHandlerExtension(undefined, 'tenant', this.errorLogger)],
			plugins: [new GraphqlInfoProviderPlugin()],
			context: ({ ctx }: { ctx: InputKoaContext }): ExtendedGraphqlContext => {
				return {
					...this.resolverContextFactory.create(ctx.state.authResult),
					errorContextProvider: () => ({
						body: ctx.request.body,
						url: ctx.request.originalUrl,
						user: ctx.state.authResult.identityId,
					}),
					koaContext: ctx,
				}
			},
		})
	}
}

export { TenantApolloServerFactory }
