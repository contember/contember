import { HttpController } from '../application/index.js'
import { HttpErrorResponse } from '../common/index.js'
import { GraphQLKoaState } from '../graphql/index.js'

export class TenantApiMiddlewareFactory {
	create(): HttpController {
		return async ctx => {
			const { timer, projectGroup, authResult, logger, koa, clientIp } = ctx
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			const tenantContainer = projectGroup.tenantContainer
			await logger.scope(async logger => {
				logger.debug('Tenant query processing started')
				// built before the handler so any custom-role lookup happens here, not inside
				// a resolver transaction where it would need a second pooled connection
				const context = await tenantContainer.resolverContextFactory.create(
					authResult,
					{
						ip: clientIp,
						userAgent: authResult.clientUserAgent,
						forwarderIp: authResult.forwarderIp,
						forwarderUserAgent: authResult.forwarderUserAgent,
						geoCountry: authResult.geoCountry,
					},
					tenantContainer.databaseContext,
					logger,
				)
				await timer('GraphQL', () =>
					projectGroup.tenantGraphQLHandler({
						request: koa.request,
						response: koa.response,
						createContext: ({ operation }) => {
							;(koa.state as GraphQLKoaState).graphql = {
								operationName: operation,
							}

							return {
								...context,
								identityId: authResult.identityId,
							}
						},
					}))
				logger.debug('Tenant query finished')
			})
		}
	}
}
