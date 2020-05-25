import { Authorizator } from '@contember/authorization'
import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import {
	ResolverContext,
	Schema,
	SystemExecutionContainer,
	typeDefs,
	createResolverContext,
} from '@contember/engine-system-api'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { Identity } from '@contember/engine-common'
import { ApolloError } from 'apollo-server-errors'
import ErrorCallbackExtension from '../../core/graphql/ErrorCallbackExtension'
import { KoaContext } from '../../core/koa'
import {
	DatabaseTransactionMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
} from '../project-common'
import { flattenVariables } from '@contember/engine-content-api'
import { ErrorContextProvider, ErrorHandlerExtension } from '../../core/graphql/ErrorHandlerExtension'
import { GraphqlInfoProviderPlugin } from '../common/GraphqlInfoProviderPlugin'

type InputKoaContext = KoaContext<
	DatabaseTransactionMiddlewareFactory.KoaState &
		AuthMiddlewareFactory.KoaState &
		ProjectMemberMiddlewareFactory.KoaState &
		ProjectResolveMiddlewareFactory.KoaState
>

type ExtendedGraphqlContext = ResolverContext & {
	errorHandler: (errors: readonly any[]) => void
	errorContextProvider: ErrorContextProvider
	koaContext: InputKoaContext
}

class SystemApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly authorizator: Authorizator<Identity>,
		private readonly executionContainerFactory: SystemExecutionContainer.Factory,
		private readonly projectName: string,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers as Config['resolvers'],
			plugins: [new GraphqlInfoProviderPlugin()],
			extensions: [() => new ErrorCallbackExtension(), () => new ErrorHandlerExtension(this.projectName, 'system')],
			context: ({ ctx }: { ctx: InputKoaContext }) => this.createContext(ctx),
		})
	}

	private createContext(ctx: InputKoaContext): ExtendedGraphqlContext {
		const systemContext = createResolverContext(
			new Identity.StaticIdentity(ctx.state.authResult.identityId, ctx.state.authResult.roles, {
				[ctx.state.projectContainer.project.slug]: ctx.state.projectMemberships.map(it => it.role),
			}),
			flattenVariables(ctx.state.projectMemberships),
			this.authorizator,
			this.executionContainerFactory.create(ctx.state.db),
		)
		return {
			...systemContext,
			errorHandler: ctx.state.planRollback,
			errorContextProvider: () => ({
				body: ctx.request.body,
				url: ctx.request.originalUrl,
				user: ctx.state.authResult.identityId,
			}),
			koaContext: ctx,
		}
	}
}

export { SystemApolloServerFactory }
