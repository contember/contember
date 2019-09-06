import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import DbQueriesExtension from '../core/graphql/DbQueriesExtension'
import { Context, ExecutionContainerFactory, flattenVariables, UserError } from '@contember/engine-content-api'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import { GraphQLError, GraphQLSchema } from 'graphql'
import { KoaContext } from '../core/koa/types'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import ContentApolloMiddlewareFactory from './ContentApolloMiddlewareFactory'
import LRUCache from 'lru-cache'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'
import { Connection } from '@contember/database'
import { extractOriginalError } from '../core/graphql/errorExtract'
import uuid = require('uuid')

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
			extensions: [() => new ErrorHandlerExtension(), () => new DbQueriesExtension()],
			formatError: (error: any) => {
				if (error instanceof AuthenticationError) {
					return { message: error.message, locations: undefined, path: undefined }
				}
				if (error instanceof ApolloError) {
					return error
				}
				const originalError = extractOriginalError(error)
				if (originalError instanceof UserError) {
					return { message: error.message, locations: undefined, path: undefined }
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
					identityVariables: flattenVariables(ctx.state.projectMemberships),
				}
				const executionContainer = new ExecutionContainerFactory(ctx.state.schema, ctx.state.permissions, {
					uuid: () => uuid.v4(),
					now: () => new Date(),
				}).create(partialContext)
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
