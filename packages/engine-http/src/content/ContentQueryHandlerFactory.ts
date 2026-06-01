import { GraphQLSchema } from 'graphql'
import { createDbQueriesListener, createGraphQLQueryHandler, GraphQLListener, GraphQLQueryHandler } from '../graphql/index.js'
import { ContentGraphqlContext } from './ContentGraphqlContext.js'
import { createTriggeredActionsListener } from './triggeredActionsListener.js'

export type ContentQueryHandler = GraphQLQueryHandler<ContentGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(private readonly debug: boolean) {}

	public create(graphQlSchema: GraphQLSchema): ContentQueryHandler {
		const listeners: GraphQLListener<ContentGraphqlContext>[] = []
		listeners.push(createDbQueriesListener(context => context.db, this.debug))
		listeners.push(createTriggeredActionsListener())

		return createGraphQLQueryHandler<ContentGraphqlContext>({
			schema: graphQlSchema,
			listeners,
		})
	}
}
