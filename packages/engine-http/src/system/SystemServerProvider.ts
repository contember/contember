import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import { ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-system-api'
import { Identity } from '@contember/engine-common'
import ErrorCallbackExtension from '../graphql/ErrorCallbackExtension'
import { KoaContext } from '../koa'
import { flattenVariables } from '@contember/engine-content-api'
import { ErrorContextProvider, ErrorHandlerExtension, ErrorLogger } from '../graphql/ErrorHandlerExtension'
import { ProjectMemberMiddlewareState, ProjectResolveMiddlewareState } from '../project-common'
import { AuthMiddlewareState } from '../common'

type InputKoaContext = KoaContext<AuthMiddlewareState & ProjectMemberMiddlewareState & ProjectResolveMiddlewareState>

type ExtendedGraphqlContext = ResolverContext & {
	errorContextProvider: ErrorContextProvider
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
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
			extensions: [
				() => new ErrorCallbackExtension(),
				() => new ErrorHandlerExtension(undefined, 'system', this.errorLogger),
			],
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createContext(ctx),
		}))
	}

	private createContext(ctx: InputKoaContext): ExtendedGraphqlContext {
		const identity = new Identity.StaticIdentity(ctx.state.authResult.identityId, ctx.state.authResult.roles, {
			[ctx.state.projectContainer.project.slug]: ctx.state.projectMemberships.map(it => it.role),
		})
		const dbContextFactory = ctx.state.projectContainer.systemDatabaseContextFactory
		const variables = flattenVariables(ctx.state.projectMemberships)
		const systemContext = this.resolverContextFactory.create(
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
		}
	}
}

export { SystemServerProvider }
