import { makeExecutableSchema } from '@graphql-tools/schema'
import { createGraphQLQueryHandler, GraphQLQueryHandler } from '@contember/engine-http'
import { ResolversFactory } from '../resolvers/ResolversFactory'
import { schema as graphqlDocument } from '../schema/actions.graphql'
import { ActionsContext } from '../resolvers/ActionsContext'


export type ActionsGraphQLHandler = GraphQLQueryHandler<ActionsContext>

export class ActionsGraphQLHandlerFactory {
	create(resolversFactory: ResolversFactory): ActionsGraphQLHandler {
		const resolvers = resolversFactory.create()
		const schema = makeExecutableSchema({
			typeDefs: graphqlDocument,
			resolvers,
		})

		return createGraphQLQueryHandler<ActionsContext>({
			schema,
			listeners: [],
		})
	}
}
