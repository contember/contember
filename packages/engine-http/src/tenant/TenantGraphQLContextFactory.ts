import { TenantGraphQLContext } from './TenantGraphQLHandlerFactory'
import { AuthResult } from '../common'
import { TenantContainer } from '@contember/engine-tenant-api'
import { KoaContext } from '../koa'
import { GraphQLKoaState } from '../graphql'

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
