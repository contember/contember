import { GraphQLSchema } from 'graphql'
import {
	createDbQueriesListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	GraphQLListener,
	GraphQLQueryHandler,
} from '../graphql'
import { ExtendedGraphqlContext } from './ContentGraphQLContextFactory'

export type ContentQueryHandler = GraphQLQueryHandler<ExtendedGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(private readonly debug: boolean) {}

	public create(graphQlSchema: GraphQLSchema): ContentQueryHandler {
		const listeners: GraphQLListener<ExtendedGraphqlContext>[] = [
			createGraphqlRequestInfoProviderListener(),
		]
		listeners.push(createDbQueriesListener(context => context.db, this.debug))

		return createGraphQLQueryHandler<ExtendedGraphqlContext>({
			schema: graphQlSchema,
			listeners,
		})
	}
}
