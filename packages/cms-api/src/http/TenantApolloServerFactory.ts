import { Authorizator } from '@contember/authorization'
import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import typeDefs from '../tenant-api/schema/tenant.graphql'
import ResolverContext from '../tenant-api/resolvers/ResolverContext'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import ProjectMemberManager from '../tenant-api/model/service/ProjectMemberManager'
import ProjectAwareIdentity from '../tenant-api/model/authorization/ProjectAwareIdentity'
import { Identity } from '@contember/engine-common'
import { Resolvers } from '../tenant-api/schema/types'

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Resolvers,
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly authorizator: Authorizator<Identity>,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			introspection: true,
			tracing: true,
			resolvers: this.resolvers as Config['resolvers'],
			context: ({ ctx }: { ctx: AuthMiddlewareFactory.ContextWithAuth }): ResolverContext => {
				const { identityId, apiKeyId, roles } = ctx.state.authResult
				return new ResolverContext(
					apiKeyId,
					new ProjectAwareIdentity(identityId, roles, this.projectMemberManager),
					this.authorizator,
				)
			},
		})
	}
}

export default TenantApolloServerFactory
