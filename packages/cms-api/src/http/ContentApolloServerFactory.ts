import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import DbQueriesExtension from '../core/graphql/DbQueriesExtension'
import { Context } from '../content-api/types'
import ExecutionContainerFactory from '../content-api/graphQlResolver/ExecutionContainerFactory'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import KnexDebugger from '../core/knex/KnexDebugger'
import { GraphQLSchema } from 'graphql'
import { Acl, Model } from 'cms-common'
import { KoaContext } from '../core/koa/types'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'

class ContentApolloServerFactory {
	constructor(private readonly knexDebugger: KnexDebugger) {}

	public create(dataSchema: GraphQLSchema, schema: Model.Schema, permissions: Acl.Permissions): ApolloServer {
		return new ApolloServer({
			tracing: true,
			introspection: true,
			extensions: [
				() => new ErrorHandlerExtension(),
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
			context: async ({
				ctx,
			}: {
				ctx: KoaContext<ProjectMemberMiddlewareFactory.KoaState & DatabaseTransactionMiddlewareFactory.KoaState>
			}): Promise<Context> => {
				const partialContext = {
					db: ctx.state.db,
					identityVariables: ctx.state.projectVariables,
				}
				const executionContainer = new ExecutionContainerFactory(schema, permissions).create(partialContext)
				return {
					...partialContext,
					executionContainer,
					errorHandler: ctx.state.planRollback,
				}
			},
			playground: false,
		})
	}
}

export default ContentApolloServerFactory
