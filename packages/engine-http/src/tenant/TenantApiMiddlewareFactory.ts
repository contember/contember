import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { GraphQLKoaState } from '../graphql'

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
				await timer('GraphQL', () => projectGroup.tenantGraphQLHandler({
					request: koa.request,
					response: koa.response,
					createContext: ({ operation }) => {
						(koa.state as GraphQLKoaState).graphql = {
							operationName: operation,
						}
						const resolverContextFactory = tenantContainer.resolverContextFactory
						const db = tenantContainer.databaseContext
						const context = resolverContextFactory.create(
							authResult,
							{ ip: clientIp, userAgent: koa.request.headers['user-agent'] },
							db,
							logger,
						)

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
