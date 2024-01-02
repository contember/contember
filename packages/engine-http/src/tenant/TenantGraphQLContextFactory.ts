import { TenantGraphQLContext } from './TenantGraphQLHandlerFactory'
import { AuthResult } from '../common'
import { TenantContainer } from '@contember/engine-tenant-api'
import { Logger } from '@contember/logger'

export class TenantGraphQLContextFactory {
	public create({ authResult, tenantContainer, logger }: {
		tenantContainer: TenantContainer
		authResult: AuthResult
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
		}
	}
}
