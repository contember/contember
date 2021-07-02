import corsMiddleware from '@koa/cors'
import { compose, route } from '../koa'
import { createAuthMiddleware, createModuleInfoMiddleware } from '../common'
import { TenantGraphQLMiddlewareFactory } from './TenantGraphQLMiddlewareFactory'

export const createTenantMiddleware = (tenantGraphqlMiddlewareFactory: TenantGraphQLMiddlewareFactory) => {
	return route(
		'/tenant$',
		compose([
			createModuleInfoMiddleware('tenant'),
			corsMiddleware(),
			createAuthMiddleware(),
			tenantGraphqlMiddlewareFactory.create(),
		]),
	)
}
