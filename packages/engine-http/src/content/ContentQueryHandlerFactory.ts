import { GraphQLSchema } from 'graphql'
import { createDbQueriesListener, createGraphQLQueryHandler, GraphQLListener, GraphQLQueryHandler } from '../graphql'
import { ContentGraphqlContext } from './ContentGraphqlContext'

export type ContentQueryHandler = GraphQLQueryHandler<ContentGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(private readonly debug: boolean) {}

	public create(graphQlSchema: GraphQLSchema): ContentQueryHandler {
		const listeners: GraphQLListener<ContentGraphqlContext>[] = []
		listeners.push(createDbQueriesListener(context => context.db, this.debug))

		return createGraphQLQueryHandler<ContentGraphqlContext>({
			schema: graphQlSchema,
			listeners,
		})
	}
}
