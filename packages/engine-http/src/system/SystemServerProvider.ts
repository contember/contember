import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import { Identity, ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-system-api'
import ErrorCallbackExtension from '../graphql/ErrorCallbackExtension'
import { KoaContext } from '../koa'
import { flattenVariables } from '@contember/engine-content-api'
import { ErrorContextProvider, ErrorHandlerExtension, ErrorLogger } from '../graphql/ErrorHandlerExtension'
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
		private readonly resolvers: Schema.Resolvers,
		private readonly resolverContextFactory: ResolverContextFactory,
		private readonly errorLogger: ErrorLogger,
	) {}

	get(): ApolloServer {
		if (this.server) {
			return this.server
		}
		return (this.server = new ApolloServer({
			introspection: true,
			playground: false,
			uploads: false,
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
			extensions: [
				() => new ErrorCallbackExtension(),
				() => new ErrorHandlerExtension(undefined, 'system', this.errorLogger),
			],
			plugins: [new GraphqlInfoProviderPlugin()],
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
