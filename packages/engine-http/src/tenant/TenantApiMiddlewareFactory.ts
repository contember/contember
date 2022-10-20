import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, LoggerMiddlewareState, TimerMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'
import { ProjectInfoMiddlewareState } from '../project-common'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'

type TenantApiMiddlewareState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
	& LoggerMiddlewareState
	& { authResult: AuthResult }

export class TenantApiMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly tenantGraphQLContextFactory: TenantGraphQLContextFactory,
	) {
	}

	create(): KoaMiddleware<TenantApiMiddlewareState> {
		return async koaContext => {
			const { request, response, state: { timer } } = koaContext
			const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
			koaContext.state.projectGroup = groupContainer.slug
			const authResult = await groupContainer.authenticator.authenticate({ request, timer })
			koaContext.state.logger.debug('User authenticated', { authResult })
			koaContext.state.authResult = authResult

			const requestLogger = koaContext.state.logger.child({
				...groupContainer.logger.attributes,
				module: 'tenant',
				user: authResult.identityId,
			})
			koaContext.state.logger = requestLogger

			const tenantContainer = groupContainer.tenantContainer
			return await requestLogger.scope(async logger => {
				logger.debug('Tenant query processing started')
				const context = this.tenantGraphQLContextFactory.create({ authResult, tenantContainer, koaContext, logger: requestLogger })

				await timer('GraphQL', () => groupContainer.tenantGraphQLHandler({
					request,
					response,
					createContext: () => context,
				}))
				logger.debug('Tenant query finished')
			})
		}
	}
}
