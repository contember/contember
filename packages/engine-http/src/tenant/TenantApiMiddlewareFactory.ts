import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'
import { GraphQLKoaState } from '../graphql'

export class TenantApiMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly tenantGraphQLContextFactory: TenantGraphQLContextFactory,
	) {
	}

	create(): HttpController {
		return async ctx => {
			const { timer, projectGroup, authResult, logger, koa } = ctx
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

						return this.tenantGraphQLContextFactory.create({ authResult, tenantContainer, logger })
					},
				}))
				logger.debug('Tenant query finished')
			})
		}
	}
}
