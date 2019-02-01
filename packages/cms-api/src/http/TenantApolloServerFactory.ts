import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import typeDefs from '../tenant-api/schema/tenant.graphql'
import ResolverContext from '../tenant-api/resolvers/ResolverContext'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import ProjectMemberManager from '../tenant-api/model/service/ProjectMemberManager'
import ProjectAwareIdentity from '../tenant-api/model/authorization/ProjectAwareIdentity'
import Authorizator from '../core/authorization/Authorizator'
import Identity from '../common/auth/Identity'

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Config['resolvers'],
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly authorizator: Authorizator<Identity>
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			introspection: true,
			tracing: true,
			resolvers: this.resolvers,
			context: ({ ctx }: { ctx: AuthMiddlewareFactory.ContextWithAuth }): ResolverContext => {
				if (ctx.state.authResult === undefined) {
					throw new AuthenticationError('/tenant endpoint requires authorization')
				}
				if (!ctx.state.authResult.valid) {
					throw new AuthenticationError(`Auth failure: ${ctx.state.authResult.error}`)
				}

				const { identityId, apiKeyId, roles } = ctx.state.authResult
				return new ResolverContext(
					apiKeyId,
					new ProjectAwareIdentity(identityId, roles, this.projectMemberManager),
					this.authorizator
				)
			},
		})
	}
}

export default TenantApolloServerFactory
