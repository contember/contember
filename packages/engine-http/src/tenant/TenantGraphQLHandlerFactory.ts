import { makeExecutableSchema } from '@graphql-tools/schema'
import { Schema, TenantResolverContext, typeDefs } from '@contember/engine-tenant-api'
import { KoaContext } from '../application'
import {
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	GraphQLKoaState,
	GraphQLQueryHandler,
} from '../graphql'

export type TenantGraphQLContext = TenantResolverContext & { identityId: string; koaContext: KoaContext<GraphQLKoaState> }

export type TenantGraphQLHandler = GraphQLQueryHandler<TenantGraphQLContext>

export class TenantGraphQLHandlerFactory {
	constructor(
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
				createGraphqlRequestInfoProviderListener(),
			],
		})
	}
}
