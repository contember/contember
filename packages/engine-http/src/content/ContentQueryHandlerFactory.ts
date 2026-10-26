import { execute, validate } from '@contember/graphql-json'
import {
	createDbQueriesListener,
	createGraphQLJsExecutor,
	createGraphQLQueryHandler,
	GraphQLExecutor,
	GraphQLListener,
	GraphQLQueryHandler,
} from '../graphql/index.js'
import { ContentGraphqlContext } from './ContentGraphqlContext.js'
import { ContentGraphQLSchema } from './GraphQlSchemaFactory.js'
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
		if (graphQlSchema.engine === 'graphql-js') {
			return createGraphQLJsExecutor(graphQlSchema.schema)
		}
		const { schema, resolvers, scalars } = graphQlSchema.schema
		return {
			// the JSON builder is checked against the graphql-js one in tests; there is no runtime schema validation
			validateSchema: () => [],
			validate: document => validate(schema, document, { scalars }),
			execute: async ({ document, operationName, variableValues, contextValue }) =>
				await execute({
					schema,
					document,
					resolvers,
					scalars,
					operationName: operationName ?? undefined,
					variableValues,
					contextValue,
				}),
		}
	}
}
