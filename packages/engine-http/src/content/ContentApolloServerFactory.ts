import { ApolloServer } from 'apollo-server-koa'
import { GraphQLSchema } from 'graphql'
import { Context, ExecutionContainerFactory, flattenVariables } from '@contember/engine-content-api'
import DbQueriesPlugin from '../graphql/DbQueriesPlugin'
import { KoaContext } from '../koa'
import { ProjectMemberMiddlewareState } from '../project-common'
import { getArgumentValues } from 'graphql/execution/values'
import { setupSystemVariables } from '@contember/engine-system-api'
import uuid from 'uuid'
import { GraphQLExtension } from 'graphql-extensions'
import { Acl, Schema } from '@contember/schema'
import { ErrorContextProvider, ErrorHandlerPlugin, ErrorLogger } from '../graphql/ErrorHandlerPlugin'
import { ContentServerMiddlewareState } from './ContentServerMiddleware'
import { AuthMiddlewareState, GraphqlInfoProviderPlugin, GraphQLInfoState, TimerMiddlewareState } from '../common'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'

type InputKoaContext = KoaContext<
	ProjectMemberMiddlewareState &
		ContentServerMiddlewareState &
		TimerMiddlewareState &
		AuthMiddlewareState &
		GraphQLInfoState
>

type ExtendedGraphqlContext = Context & { errorContextProvider: ErrorContextProvider; koaContext: InputKoaContext }

class ContentApolloServerFactory {
	constructor(
		private readonly projectName: string,
		private readonly debug: boolean,
		private readonly errorLogger: ErrorLogger,
	) {}

	public create(permissions: Acl.Permissions, schema: Schema, dataSchema: GraphQLSchema): ApolloServer {
		const plugins: ApolloServerPlugin[] = [
			new GraphqlInfoProviderPlugin(),
			new ErrorHandlerPlugin(this.projectName, 'content', this.errorLogger),
		]
		if (this.debug) {
			plugins.push(new DbQueriesPlugin())
		}
		return new ApolloServer({
			uploads: false,
			playground: false,
			introspection: true,
			tracing: this.debug,
			schema: dataSchema,
			plugins,
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createGraphqlContext(permissions, schema, ctx),
		})
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
		let identityId = ctx.state.authResult.identityId
		if (
			ctx.state.authResult.assumedIdentityId &&
			Object.values(schema.acl.roles).find(it => it.system?.assumeIdentity)
		) {
			identityId = ctx.state.authResult.assumedIdentityId
		}
		const executionContainer = new ExecutionContainerFactory(schema, permissions, providers, getArgumentValues, db =>
			setupSystemVariables(db, identityId, providers),
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
