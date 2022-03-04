import { devTypeDefs, ResolverFactory, SystemResolverContext, typeDefs } from '@contember/engine-system-api'
import {
	createDbQueriesListener,
	createErrorListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	ErrorLogger,
	GraphQLKoaState,
	GraphQLListener,
	GraphQLQueryHandler,
} from '../graphql'
import { KoaContext } from '../koa'
import { DocumentNode } from 'graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ContentSchemaResolver } from '../content'

type KoaState =
	& GraphQLKoaState

export type SystemGraphQLContext = SystemResolverContext & {
	koaContext: KoaContext<KoaState>
	contentSchemaResolver: ContentSchemaResolver
}

export type SystemGraphQLHandler = GraphQLQueryHandler<SystemGraphQLContext>

export class SystemGraphQLHandlerFactory {
	constructor(
		private readonly errorLogger: ErrorLogger,
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
			createErrorListener((err, ctx) => {
				this.errorLogger(err, {
					body: ctx.koaContext.request.body as string,
					url: ctx.koaContext.request.originalUrl,
					user: ctx.identity.id,
					module: 'system',
					project: ctx.project.slug,
				})
			}),
			createGraphqlRequestInfoProviderListener(),
		]
		if (this.debugMode) {
			listeners.push({
				onResponse: ({ context }) => {
					context.contentSchemaResolver.clearCache()
				},
			})
			listeners.push(createDbQueriesListener(context => context.db.client))
		}
		return createGraphQLQueryHandler<SystemGraphQLContext>({
			schema,
			listeners,
		})
	}
}
