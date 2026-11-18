import {
	createDbQueriesListener,
	createGraphQLJsExecutor,
	createGraphQLJsonExecutor,
	createGraphQLQueryHandler,
	GraphQLExecutor,
	GraphQLListener,
	GraphQLQueryHandler,
} from '../graphql/index.js'
import { ContentGraphQLSchema } from './ContentGraphQLEngine.js'
import { ContentGraphqlContext } from './ContentGraphqlContext.js'
import { createTriggeredActionsListener } from './triggeredActionsListener.js'

export type ContentQueryHandler = GraphQLQueryHandler<ContentGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(private readonly debug: boolean) {}

	public create(graphQlSchema: ContentGraphQLSchema): ContentQueryHandler {
		const listeners: GraphQLListener<ContentGraphqlContext>[] = []
		listeners.push(createDbQueriesListener(context => context.db, this.debug))
		listeners.push(createTriggeredActionsListener())

		return createGraphQLQueryHandler<ContentGraphqlContext>({
			executor: this.createExecutor(graphQlSchema),
			listeners,
			getMemoryBudget: context => context.memoryBudget,
		})
	}

	private createExecutor(graphQlSchema: ContentGraphQLSchema): GraphQLExecutor<ContentGraphqlContext> {
		return graphQlSchema.engine === 'graphql-js' ? createGraphQLJsExecutor(graphQlSchema.schema) : createGraphQLJsonExecutor(graphQlSchema.schema)
	}
}
