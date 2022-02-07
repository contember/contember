import { devTypeDefs, Identity, ResolverFactory, SystemResolverContext, typeDefs } from '@contember/engine-system-api'
import {
	createDbQueriesListener,
	createErrorListener,
	createGraphQLQueryHandler,
	createGraphqlRequestInfoProviderListener,
	ErrorLogger,
	GraphQLKoaState,
	GraphQLListener,
} from '../graphql'
import { KoaContext, KoaMiddleware } from '../koa'
import { DocumentNode } from 'graphql'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ProjectGroupState, ProjectMemberMiddlewareState, ProjectResolveMiddlewareState } from '../project-common'
import { AuthMiddlewareState } from '../common'

type KoaState =
	& AuthMiddlewareState
	& ProjectGroupState
	& ProjectMemberMiddlewareState
	& ProjectResolveMiddlewareState
	& GraphQLKoaState

export type SystemGraphQLContext = SystemResolverContext & {
	koaContext: KoaContext<KoaState>
}

export class SystemGraphQLHandlerFactory {
	constructor(
		private readonly errorLogger: ErrorLogger,
		private readonly debugMode: boolean,
	) {
	}

	create(resolversFactory: ResolverFactory): KoaMiddleware<KoaState> {
		const defs: DocumentNode[] = [typeDefs]
		if (this.debugMode) {
			defs.push(devTypeDefs)
		}
		const mergedDefs = mergeTypeDefs(defs)
		const resolvers = resolversFactory.create(this.debugMode)
		const schema = makeExecutableSchema({
			typeDefs: mergedDefs,
			resolvers,
		})

		const listeners: GraphQLListener<SystemGraphQLContext>[] = [
			createErrorListener((err, ctx) => {
				this.errorLogger(err, {
					body: ctx.koaContext.request.body as string,
					url: ctx.koaContext.request.originalUrl,
					user: ctx.koaContext.state.authResult.identityId,
					module: 'system',
					project: ctx.koaContext.state.project.slug,
				})
			}),
			createGraphqlRequestInfoProviderListener(),
		]
		if (this.debugMode) {
			listeners.push({
				onResponse: ({ context }) => {
					context.koaContext.state.projectContainer.contentSchemaResolver.clearCache()
				},
			})
			listeners.push(createDbQueriesListener(context => context.db.client))
		}
		return createGraphQLQueryHandler<SystemGraphQLContext, KoaState>({
			schema,
			contextFactory: ctx => this.createContext(ctx),
			listeners,
		})
	}

	private async createContext(ctx: KoaContext<KoaState>): Promise<SystemGraphQLContext> {
		const identity = new Identity(
			ctx.state.authResult.identityId,
			ctx.state.projectMemberships.map(it => it.role),
		)
		const projectContainer = ctx.state.projectContainer
		const dbContextFactory = projectContainer.systemDatabaseContextFactory

		const systemContext = await ctx.state.projectGroupContainer.systemContainer.resolverContextFactory.create(
			dbContextFactory.create(identity.id),
			ctx.state.project,
			identity,
		)
		return {
			...systemContext,
			koaContext: ctx,
		}
	}
}
