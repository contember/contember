import { GraphQLSchema } from 'graphql'
import { Context, ExecutionContainerFactory, flattenVariables } from '@contember/engine-content-api'
import { createDbQueriesListener } from '../graphql/dbQueriesListener'
import { KoaContext, KoaMiddleware } from '../koa'
import { ProjectMemberMiddlewareState } from '../project-common'
import { getArgumentValues } from 'graphql/execution/values'
import { setupSystemVariables } from '@contember/engine-system-api'
import { v4 as uuidv4 } from 'uuid'
import { Acl, Schema } from '@contember/schema'
import { ContentServerMiddlewareState } from './ContentServerMiddleware'
import { AuthMiddlewareState, TimerMiddlewareState } from '../common'
import { createGraphQLQueryHandler, GraphQLListener } from '../graphql/execution'
import { createErrorListener, ErrorLogger } from '../graphql/errors'
import { createGraphqlRequestInfoProviderListener, GraphQLKoaState } from '../graphql/state'

export type KoaState = ProjectMemberMiddlewareState &
	ContentServerMiddlewareState &
	TimerMiddlewareState &
	AuthMiddlewareState &
	GraphQLKoaState
type InputKoaContext = KoaContext<KoaState>

type ExtendedGraphqlContext = Context & { koaContext: KoaContext<KoaState> }

class ContentQueryHandlerFactory {
	constructor(
		private readonly projectName: string,
		private readonly debug: boolean,
		private readonly errorLogger: ErrorLogger,
	) {}

	public create(permissions: Acl.Permissions, schema: Schema, dataSchema: GraphQLSchema): KoaMiddleware<KoaState> {
		const listeners: GraphQLListener<ExtendedGraphqlContext>[] = [
			createErrorListener((err, ctx) => {
				this.errorLogger(err, {
					body: ctx.koaContext.request.body as string,
					url: ctx.koaContext.request.originalUrl,
					user: ctx.koaContext.state.authResult.identityId,
					module: 'content',
					project: this.projectName,
				})
			}),
			createGraphqlRequestInfoProviderListener(),
		]
		if (this.debug) {
			listeners.push(createDbQueriesListener(context => context.db))
		}

		return createGraphQLQueryHandler<ExtendedGraphqlContext, KoaState>({
			schema: dataSchema,
			contextFactory: ctx => this.createGraphqlContext(permissions, schema, ctx),
			listeners,
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
			uuid: () => uuidv4(),
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
			koaContext: ctx,
		}
	}
}

export { ContentQueryHandlerFactory }
