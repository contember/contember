import { execute, validate } from '@contember/graphql-json'
import { JsonContentSchema } from '@contember/engine-content-api'
import { createDbQueriesListener, createGraphQLQueryHandler, GraphQLExecutor, GraphQLListener, GraphQLQueryHandler } from '../graphql/index.js'
import { ContentGraphqlContext } from './ContentGraphqlContext.js'
import { createTriggeredActionsListener } from './triggeredActionsListener.js'

export type ContentQueryHandler = GraphQLQueryHandler<ContentGraphqlContext>

export class ContentQueryHandlerFactory {
	constructor(private readonly debug: boolean) {}

	public create(graphQlSchema: JsonContentSchema): ContentQueryHandler {
		const listeners: GraphQLListener<ContentGraphqlContext>[] = []
		listeners.push(createDbQueriesListener(context => context.db, this.debug))
		listeners.push(createTriggeredActionsListener())

		return createGraphQLQueryHandler<ContentGraphqlContext>({
			executor: this.createExecutor(graphQlSchema),
			listeners,
			getMemoryBudget: context => context.memoryBudget,
		})
	}

	private createExecutor({ schema, resolvers, scalars }: JsonContentSchema): GraphQLExecutor<ContentGraphqlContext> {
		return {
			// the builder output is validated as a graphql-js schema in tests; there is no runtime schema validation
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
