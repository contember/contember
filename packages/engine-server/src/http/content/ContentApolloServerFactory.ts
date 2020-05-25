import { ApolloServer } from 'apollo-server-koa'
import DbQueriesExtension from '../../core/graphql/DbQueriesExtension'
import { Context, ExecutionContainerFactory, flattenVariables } from '@contember/engine-content-api'
import { GraphQLSchema } from 'graphql'
import { KoaContext } from '../../core/koa'
import { DatabaseTransactionMiddlewareFactory, ProjectMemberMiddlewareFactory } from '../project-common'
import { ContentApolloMiddlewareFactory } from './ContentApolloMiddlewareFactory'
import LRUCache from 'lru-cache'
import { getArgumentValues } from 'graphql/execution/values'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { setupSystemVariables } from '@contember/engine-system-api'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'
import uuid from 'uuid'
import { GraphQLExtension } from 'graphql-extensions'
import { Acl, Schema } from '@contember/schema'
import { ErrorContextProvider, ErrorHandlerExtension } from '../../core/graphql/ErrorHandlerExtension'
import { GraphqlInfoProviderPlugin } from '../common/GraphqlInfoProviderPlugin'

type InputKoaContext = KoaContext<
	ProjectMemberMiddlewareFactory.KoaState &
		DatabaseTransactionMiddlewareFactory.KoaState &
		ContentApolloMiddlewareFactory.KoaState &
		TimerMiddlewareFactory.KoaState &
		AuthMiddlewareFactory.KoaState
>

type ExtendedGraphqlContext = Context & { errorContextProvider: ErrorContextProvider; koaContext: InputKoaContext }
class ContentApolloServerFactory {
	private cache = new LRUCache<GraphQLSchema, ApolloServer>({
		max: 100,
	})

	constructor(private readonly projectName: string, private readonly debug: boolean) {}

	public create(permissions: Acl.Permissions, schema: Schema, dataSchema: GraphQLSchema): ApolloServer {
		const server = this.cache.get(dataSchema)
		if (server) {
			return server
		}
		const extensions: Array<() => GraphQLExtension> = []
		extensions.push(() => new ErrorHandlerExtension(this.projectName, 'content'))
		if (this.debug) {
			extensions.push(() => new DbQueriesExtension())
		}
		const newServer = new ApolloServer({
			uploads: false,
			playground: false,
			introspection: true,
			tracing: this.debug,
			extensions,
			schema: dataSchema,
			plugins: [new GraphqlInfoProviderPlugin()],
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createGraphqlContext(permissions, schema, ctx),
		})
		this.cache.set(dataSchema, newServer)
		return newServer
	}

	private createGraphqlContext(
		permissions: Acl.Permissions,
		schema: Schema,
		ctx: InputKoaContext,
	): ExtendedGraphqlContext {
		const partialContext = {
			db: ctx.state.db,
			identityVariables: flattenVariables(ctx.state.projectMemberships),
		}
		const providers = {
			uuid: () => uuid.v4(),
			now: () => new Date(),
		}
		const executionContainer = new ExecutionContainerFactory(schema, permissions, providers, getArgumentValues, db =>
			setupSystemVariables(db, ctx.state.authResult.identityId, providers),
		).create(partialContext)
		return {
			...partialContext,
			executionContainer,
			timer: ctx.state.timer,
			errorContextProvider: () => ({
				user: ctx.state.authResult.identityId,
				body: ctx.request.body,
				url: ctx.request.originalUrl,
			}),
			koaContext: ctx,
		}
	}
}

export { ContentApolloServerFactory }
