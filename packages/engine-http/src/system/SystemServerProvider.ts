import { Config } from 'apollo-server-core'
import { ApolloServer, mergeSchemas } from 'apollo-server-koa'
import {
	devTypeDefs,
	Identity,
	ResolverContext,
	ResolverContextFactory,
	ResolverFactory,
	Schema,
	typeDefs,
} from '@contember/engine-system-api'
import { KoaContext } from '../koa'
import { flattenVariables } from '@contember/engine-content-api'
import { ErrorContextProvider, ErrorHandlerPlugin, ErrorLogger } from '../graphql/ErrorHandlerPlugin'
import { ProjectMemberMiddlewareState, ProjectResolveMiddlewareState } from '../project-common'
import { AuthMiddlewareState, GraphqlInfoProviderPlugin, GraphQLInfoState } from '../common'

type InputKoaContext = KoaContext<
	AuthMiddlewareState & ProjectMemberMiddlewareState & ProjectResolveMiddlewareState & GraphQLInfoState
>

type ExtendedGraphqlContext = ResolverContext & {
	errorContextProvider: ErrorContextProvider
	koaContext: InputKoaContext
}

class SystemServerProvider {
	private server: ApolloServer | null = null

	constructor(
		private readonly resolversFactory: ResolverFactory,
		private readonly resolverContextFactory: ResolverContextFactory,
		private readonly errorLogger: ErrorLogger,
		private readonly debugMode: boolean,
	) {}

	get(): ApolloServer {
		if (this.server) {
			return this.server
		}
		const schemas: Parameters<typeof mergeSchemas>[0]['schemas'] = [typeDefs]
		if (this.debugMode) {
			schemas.push(devTypeDefs)
		}
		const resolvers = this.resolversFactory.create(this.debugMode)
		const mergedSchema = mergeSchemas({ schemas, resolvers: resolvers as Config['resolvers'] })
		return (this.server = new ApolloServer({
			schema: mergedSchema,
			plugins: [new GraphqlInfoProviderPlugin(), new ErrorHandlerPlugin(undefined, 'system', this.errorLogger)],
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createContext(ctx),
		}))
	}

	private async createContext(ctx: InputKoaContext): Promise<ExtendedGraphqlContext> {
		const identity = new Identity(
			ctx.state.authResult.identityId,
			ctx.state.projectMemberships.map(it => it.role),
		)
		const dbContextFactory = ctx.state.projectContainer.systemDatabaseContextFactory
		const variables = flattenVariables(ctx.state.projectMemberships)
		const systemContext = await this.resolverContextFactory.create(
			dbContextFactory.create(identity.id),
			ctx.state.project,
			identity,
			variables,
		)
		return {
			...systemContext,
			errorContextProvider: () => ({
				body: ctx.request.body,
				project: ctx.state.project.slug,
				url: ctx.request.originalUrl,
				user: ctx.state.authResult.identityId,
			}),
			koaContext: ctx,
		}
	}
}

export { SystemServerProvider }
