import { devTypeDefs, ResolverFactory, SystemResolverContext, typeDefs } from '@contember/engine-system-api'
import { createDbQueriesListener, createGraphQLQueryHandler, GraphQLListener, GraphQLQueryHandler } from '../graphql'
import { DocumentNode } from 'graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'

export type SystemGraphQLContext = SystemResolverContext & {
	onClearCache: () => void
}

export type SystemGraphQLHandler = GraphQLQueryHandler<SystemGraphQLContext>

export class SystemGraphQLHandlerFactory {
	constructor(
		private readonly debugMode: boolean,
	) {
	}

	create(resolversFactory: ResolverFactory): SystemGraphQLHandler {
		const defs: DocumentNode[] = [typeDefs]
		if (this.debugMode) {
			defs.push(devTypeDefs)
		}
		const mergedDefs = mergeTypeDefs(defs)
		const resolvers = resolversFactory.create(this.debugMode)
		const schema = makeExecutableSchema({
			typeDefs: mergedDefs,
			resolvers,
		})

		const listeners: GraphQLListener<SystemGraphQLContext>[] = []
		if (this.debugMode) {
			listeners.push({
				onResponse: ({ context }) => {
					context.onClearCache()
				},
			})
			listeners.push(createDbQueriesListener(context => context.db.client, this.debugMode))
		}
		return createGraphQLQueryHandler<SystemGraphQLContext>({
			schema,
			listeners,
		})
	}
}
