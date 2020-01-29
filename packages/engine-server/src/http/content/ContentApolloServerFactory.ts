import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import { ApolloError as ApolloCoreError } from 'apollo-server-core'
import DbQueriesExtension from '../../core/graphql/DbQueriesExtension'
import { Context, ExecutionContainerFactory, flattenVariables, UserError } from '@contember/engine-content-api'
import ErrorHandlerExtension from '../../core/graphql/ErrorHandlerExtension'
import { GraphQLSchema, GraphQLError } from 'graphql'
import { KoaContext } from '../../core/koa'
import { DatabaseTransactionMiddlewareFactory, ProjectMemberMiddlewareFactory } from '../project-common'
import { ContentApolloMiddlewareFactory } from './ContentApolloMiddlewareFactory'
import LRUCache from 'lru-cache'
import { getArgumentValues } from 'graphql/execution/values'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { setupSystemVariables } from '@contember/engine-system-api'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'
import { extractOriginalError } from '../../core/graphql/errorExtract'
import uuid from 'uuid'
import { GraphQLExtension } from 'graphql-extensions'
import { Acl, Schema } from '@contember/schema'

class ContentApolloServerFactory {
	private cache = new LRUCache<GraphQLSchema, ApolloServer>({
		max: 100,
	})

	constructor(private readonly debug: boolean) {}

	public create(permissions: Acl.Permissions, schema: Schema, dataSchema: GraphQLSchema): ApolloServer {
		const server = this.cache.get(dataSchema)
		if (server) {
			return server
		}
		const extensions: Array<() => GraphQLExtension> = [() => new ErrorHandlerExtension()]
		if (this.debug) {
			extensions.push(() => new DbQueriesExtension())
		}
		const newServer = new ApolloServer({
			tracing: this.debug,
			introspection: true,
			extensions: extensions,
			formatError: (error: any) => {
				if (error instanceof AuthenticationError) {
					return { message: error.message, locations: undefined, path: undefined }
				}
				if (error instanceof ApolloError) {
					return error
				}
				const originalError = extractOriginalError(error)
				if (
					originalError instanceof GraphQLError ||
					originalError instanceof ApolloError ||
					originalError instanceof ApolloCoreError
				) {
					return error
				}
				if (originalError instanceof UserError) {
					return { message: error.message, locations: error.locations, path: error.path }
				}
				console.error(originalError || error)
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
						TimerMiddlewareFactory.KoaState &
						AuthMiddlewareFactory.KoaState
				>
			}): Promise<Context> => {
				const partialContext = {
					db: ctx.state.db,
					identityVariables: flattenVariables(ctx.state.projectMemberships),
				}
				const providers = {
					uuid: () => uuid.v4(),
					now: () => new Date(),
				}
				const executionContainer = new ExecutionContainerFactory(
					schema,
					permissions,
					providers,
					getArgumentValues,
					db => setupSystemVariables(db, ctx.state.authResult.identityId, providers),
				).create(partialContext)
				return {
					...partialContext,
					executionContainer,
					timer: ctx.state.timer,
				}
			},
			playground: false,
		})
		this.cache.set(dataSchema, newServer)
		return newServer
	}
}

export { ContentApolloServerFactory }
