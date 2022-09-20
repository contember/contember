import { GraphQLSchema } from 'graphql'
import {
	createDbQueriesListener,
	createErrorListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	ErrorLogger,
	GraphQLListener, GraphQLQueryHandler,
} from '../graphql'
import { ExtendedGraphqlContext } from './ContentGraphQLContextFactory'

export type ContentQueryHandler = GraphQLQueryHandler<ExtendedGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly errorLogger: ErrorLogger,
	) {}

	public create(graphQlSchema: GraphQLSchema, projectSlug: string): ContentQueryHandler {
		const listeners: GraphQLListener<ExtendedGraphqlContext>[] = [
			createErrorListener((err, ctx) => {
				this.errorLogger(err, {
					body: ctx.koaContext.request.body as string,
					url: ctx.koaContext.request.originalUrl,
					user: ctx.identityId,
					module: 'content',
					project: projectSlug,
				})
			}),
			createGraphqlRequestInfoProviderListener(),
		]
		listeners.push(createDbQueriesListener(context => context.db, this.debug))

		return createGraphQLQueryHandler<ExtendedGraphqlContext>({
			schema: graphQlSchema,
			listeners,
		})
	}
}
