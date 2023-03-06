import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'

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
			logger.debug('Tenant query processing started')
			const context = this.tenantGraphQLContextFactory.create({ authResult, tenantContainer, koaContext: koa, logger })

			await timer('GraphQL', () => projectGroup.tenantGraphQLHandler({
				request: koa.request,
				response: koa.response,
				createContext: () => context,
			}))
			logger.debug('Tenant query finished')
		}
	}
}
