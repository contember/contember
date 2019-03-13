import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import DbQueriesExtension from '../core/graphql/DbQueriesExtension'
import { Context } from '../content-api/types'
import ExecutionContainerFactory from '../content-api/graphQlResolver/ExecutionContainerFactory'
import KnexDebugger from '../core/knex/KnexDebugger'
import { GraphQLSchema } from 'graphql'
import LRUCache from 'lru-cache'

class ContentApolloServerFactory {
	private cache = new LRUCache<GraphQLSchema, ApolloServer>({
		max: 100,
	})

	constructor(private readonly knexDebugger: KnexDebugger) {}

	public create(dataSchema: GraphQLSchema): ApolloServer {
		const server = this.cache.get(dataSchema)
		if (server) {
			return server
		}
		const newServer = new ApolloServer({
			tracing: true,
			introspection: true,
			extensions: [
				() => {
					const queriesExt = new DbQueriesExtension()
					this.knexDebugger.subscribe(query => queriesExt.addQuery(query))
					return queriesExt
				},
			],
			formatError: (error: any) => {
				if (error instanceof AuthenticationError) {
					return { message: error.message, locations: undefined, path: undefined }
				}
				if (error instanceof ApolloError) {
					return error
				}
				console.error(error.originalError || error)
				return { message: 'Internal server error', locations: undefined, path: undefined }
			},
			schema: dataSchema,
			uploads: false,
			context: async ({ ctx }: { ctx: any }): Promise<Context> => {
				const partialContext = {
					db: ctx.state.db,
					identityVariables: ctx.state.projectVariables,
				}
				const executionContainer = new ExecutionContainerFactory(ctx.state.schema, ctx.state.permissions).create(
					partialContext
				)
				return {
					...partialContext,
					executionContainer,
				}
			},
			playground: false,
		})
		this.cache.set(dataSchema, newServer)
		return newServer
	}
}

export default ContentApolloServerFactory
