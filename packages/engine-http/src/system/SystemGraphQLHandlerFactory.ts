import { devTypeDefs, ResolverFactory, SystemResolverContext, typeDefs } from '@contember/engine-system-api'
import {
	createDbQueriesListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	GraphQLKoaState,
	GraphQLListener,
	GraphQLQueryHandler,
} from '../graphql'
import { KoaContext } from '../application'
import { DocumentNode } from 'graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'

type KoaState =
	& GraphQLKoaState

export type SystemGraphQLContext = SystemResolverContext & {
	koaContext: KoaContext<KoaState>
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

		const listeners: GraphQLListener<SystemGraphQLContext>[] = [
			createGraphqlRequestInfoProviderListener(),
		]
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
