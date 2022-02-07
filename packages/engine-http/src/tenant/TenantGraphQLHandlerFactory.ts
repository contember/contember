import { makeExecutableSchema } from '@graphql-tools/schema'
import { Schema, TenantResolverContext, typeDefs } from '@contember/engine-tenant-api'
import { AuthMiddlewareState } from '../common'
import { KoaContext, KoaMiddleware } from '../koa'
import {
	createErrorListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	ErrorLogger,
	GraphQLKoaState,
} from '../graphql'
import { ProjectGroupState } from '../project-common'

type KoaState =
	& ProjectGroupState
	& AuthMiddlewareState
	& GraphQLKoaState

export type TenantGraphQLContext = TenantResolverContext & {
	koaContext: KoaContext<KoaState>
}

export class TenantGraphQLHandlerFactory {
	constructor(
		private readonly errorLogger: ErrorLogger,
	) {}

	create(resolvers: Schema.Resolvers): KoaMiddleware<KoaState> {
		const schema = makeExecutableSchema({
			typeDefs,
			resolvers: resolvers,
			resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
		})
		return createGraphQLQueryHandler<TenantGraphQLContext, KoaState>({
			schema,
			contextFactory: ctx => {
				const projectGroupContainer = ctx.state.projectGroupContainer
				const resolverContextFactory = projectGroupContainer.tenantContainer.resolverContextFactory
				const db = projectGroupContainer.tenantContainer.databaseContext
				const context = resolverContextFactory.create(
					ctx.state.authResult,
					db,
				)
				return {
					...context,
					koaContext: ctx,
				}
			},
			listeners: [
				createErrorListener((err, ctx) => {
					this.errorLogger(err, {
						body: ctx.koaContext.request.body as string,
						url: ctx.koaContext.request.originalUrl,
						user: ctx.koaContext.state.authResult.identityId,
						module: 'tenant',
						project: undefined,
					})
				}),
				createGraphqlRequestInfoProviderListener(),
			],
		})
	}
}
