import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import DbQueriesExtension from '../core/graphql/DbQueriesExtension'
import { Context } from '../content-api/types'
import ExecutionContainerFactory from '../content-api/graphQlResolver/ExecutionContainerFactory'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import { GraphQLSchema } from 'graphql'
import { KoaContext } from '../core/koa/types'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import ContentApolloMiddlewareFactory from './ContentApolloMiddlewareFactory'
import LRUCache from 'lru-cache'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'
import Connection from '../core/knex/Connection'
import EventManager from '../core/knex/EventManager'

class ContentApolloServerFactory {
	private cache = new LRUCache<GraphQLSchema, ApolloServer>({
		max: 100,
	})

	constructor(private readonly connection: Connection) {}

	public create(dataSchema: GraphQLSchema): ApolloServer {
		const server = this.cache.get(dataSchema)
		if (server) {
			return server
		}
		const newServer = new ApolloServer({
			tracing: true,
			introspection: true,
			extensions: [
				() => new ErrorHandlerExtension(),
				() => {
					const queriesExt = new DbQueriesExtension()
					this.connection.eventManager.on(EventManager.Event.queryEnd, ({sql, parameters, meta}, {timing}) =>
						queriesExt.addQuery({sql, bindings: parameters, elapsed: timing ? timing.selfDuration : 0, meta}))
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
			context: async ({
				ctx,
			}: {
				ctx: KoaContext<
					ProjectMemberMiddlewareFactory.KoaState &
						DatabaseTransactionMiddlewareFactory.KoaState &
						ContentApolloMiddlewareFactory.KoaState &
						TimerMiddlewareFactory.KoaState
				>
			}): Promise<Context> => {
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
					errorHandler: ctx.state.planRollback,
					timer: ctx.state.timer,
				}
			},
			playground: false,
		})
		this.cache.set(dataSchema, newServer)
		return newServer
	}
}

export default ContentApolloServerFactory
