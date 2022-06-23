import { TenantGraphQLContext } from './TenantGraphQLHandlerFactory.js'
import { AuthResult } from '../common/index.js'
import { TenantContainer } from '@contember/engine-tenant-api'
import { KoaContext } from '../koa/index.js'
import { GraphQLKoaState } from '../graphql/index.js'

export class TenantGraphQLContextFactory {
	public create({ authResult, tenantContainer, koaContext }: {
		tenantContainer: TenantContainer
		authResult: AuthResult
		koaContext: KoaContext<GraphQLKoaState>
	}): TenantGraphQLContext {
		const resolverContextFactory = tenantContainer.resolverContextFactory
		const db = tenantContainer.databaseContext
		const context = resolverContextFactory.create(
			authResult,
			db,
		)
		return {
			...context,
			identityId: authResult.identityId,
			koaContext,
		}
	}
}
