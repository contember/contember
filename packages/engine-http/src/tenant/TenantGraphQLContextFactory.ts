import { TenantGraphQLContext } from './TenantGraphQLHandlerFactory'
import { AuthResult } from '../common'
import { TenantContainer } from '@contember/engine-tenant-api'
import { KoaContext } from '../koa'
import { GraphQLKoaState } from '../graphql'
import { Logger } from '@contember/engine-common'

export class TenantGraphQLContextFactory {
	public create({ authResult, tenantContainer, koaContext, logger }: {
		tenantContainer: TenantContainer
		authResult: AuthResult
		koaContext: KoaContext<GraphQLKoaState>
		logger: Logger
	}): TenantGraphQLContext {
		const resolverContextFactory = tenantContainer.resolverContextFactory
		const db = tenantContainer.databaseContext
		const context = resolverContextFactory.create(
			authResult,
			db,
			logger,
		)
		return {
			...context,
			identityId: authResult.identityId,
			koaContext,
		}
	}
}
