import { makeExecutableSchema } from '@graphql-tools/schema'
import { Schema, TenantResolverContext, typeDefs } from '@contember/engine-tenant-api'
import { KoaContext } from '../koa/index.js'
import {
	createErrorListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	ErrorLogger,
	GraphQLKoaState,
	GraphQLQueryHandler,
} from '../graphql/index.js'

export type TenantGraphQLContext = TenantResolverContext & { identityId: string; koaContext: KoaContext<GraphQLKoaState> }

export type TenantGraphQLHandler = GraphQLQueryHandler<TenantGraphQLContext>

export class TenantGraphQLHandlerFactory {
	constructor(
		private readonly errorLogger: ErrorLogger,
	) {}

	create(resolvers: Schema.Resolvers): TenantGraphQLHandler {
		const schema = makeExecutableSchema({
			typeDefs,
			resolvers: resolvers,
			resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
		})
		return createGraphQLQueryHandler<TenantGraphQLContext>({
			schema,
			listeners: [
				createErrorListener((err, ctx) => {
					this.errorLogger(err, {
						body: ctx.koaContext.request.body as string,
						url: ctx.koaContext.request.originalUrl,
						user: ctx.identityId,
						module: 'tenant',
						project: undefined,
					})
				}),
				createGraphqlRequestInfoProviderListener(),
			],
		})
	}
}
