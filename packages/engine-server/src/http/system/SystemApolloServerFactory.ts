import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import { ResolverContext, ResolverContextFactory, Schema, typeDefs } from '@contember/engine-system-api'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { Identity } from '@contember/engine-common'
import ErrorCallbackExtension from '../../core/graphql/ErrorCallbackExtension'
import { KoaContext } from '../../core/koa'
import { ProjectMemberMiddlewareFactory, ProjectResolveMiddlewareFactory } from '../project-common'
import { flattenVariables } from '@contember/engine-content-api'
import { ErrorContextProvider, ErrorHandlerExtension } from '../../core/graphql/ErrorHandlerExtension'

type InputKoaContext = KoaContext<
	AuthMiddlewareFactory.KoaState & ProjectMemberMiddlewareFactory.KoaState & ProjectResolveMiddlewareFactory.KoaState
>

type ExtendedGraphqlContext = ResolverContext & {
	errorContextProvider: ErrorContextProvider
}

class SystemApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly resolverContextFactory: ResolverContextFactory,
		private readonly projectName: string,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
			extensions: [() => new ErrorCallbackExtension(), () => new ErrorHandlerExtension(this.projectName, 'system')],
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createContext(ctx),
		})
	}

	private createContext(ctx: InputKoaContext): ExtendedGraphqlContext {
		const identity = new Identity.StaticIdentity(ctx.state.authResult.identityId, ctx.state.authResult.roles, {
			[ctx.state.projectContainer.project.slug]: ctx.state.projectMemberships.map(it => it.role),
		})
		const systemContext = this.resolverContextFactory.create(identity, flattenVariables(ctx.state.projectMemberships))
		return {
			...systemContext,
			errorContextProvider: () => ({
				body: ctx.request.body,
				url: ctx.request.originalUrl,
				user: ctx.state.authResult.identityId,
			}),
		}
	}
}

export { SystemApolloServerFactory }
