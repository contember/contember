import { Authorizator } from '@contember/authorization'
import { Config } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-koa'
import {
	ProjectAwareIdentity,
	ProjectMemberManager,
	ResolverContext,
	Schema,
	schemaDocument,
} from '@contember/engine-tenant-api'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { Identity } from '@contember/engine-common'

class TenantApolloServerFactory {
	constructor(
		private readonly resolvers: Schema.Resolvers,
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly authorizator: Authorizator<Identity>,
	) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs: schemaDocument,
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
