import { makeExecutableSchema } from '@graphql-tools/schema'
import { Schema, TenantResolverContext, typeDefs } from '@contember/engine-tenant-api'
import { createGraphQLQueryHandler, GraphQLQueryHandler } from '../graphql'

export type TenantGraphQLContext = TenantResolverContext & { identityId: string }

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
			listeners: [],
		})
	}
}
