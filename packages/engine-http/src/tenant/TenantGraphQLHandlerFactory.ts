import { makeExecutableSchema } from '@graphql-tools/schema'
import { Schema, TenantResolverContext, typeDefs } from '@contember/engine-tenant-api'
import { createGraphQLJsExecutor, createGraphQLQueryHandler, GraphQLQueryHandler } from '../graphql/index.js'

export type TenantGraphQLContext = TenantResolverContext & { identityId: string }

export type TenantGraphQLHandler = GraphQLQueryHandler<TenantGraphQLContext>

export class TenantGraphQLHandlerFactory {
	create(resolvers: Schema.Resolvers): TenantGraphQLHandler {
		const schema = makeExecutableSchema({
			typeDefs,
			resolvers: resolvers,
			resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
		})
		return createGraphQLQueryHandler<TenantGraphQLContext>({
			executor: createGraphQLJsExecutor(schema),
			listeners: [],
		})
	}
}
