import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, LoggerMiddlewareState, LoggerRequestSymbol, TimerMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory'
import { withLogger } from '@contember/engine-common'

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
			koaContext.state.authResult = authResult

			const requestLogger = groupContainer.logger.child({
				module: 'tenant',
				method: koaContext.request.method,
				url: koaContext.request.originalUrl,
				user: authResult.identityId,
				requestId: Math.random().toString().substring(2),
				[LoggerRequestSymbol]: koaContext.request,
			})
			koaContext.state.logger = requestLogger

			const tenantContainer = groupContainer.tenantContainer
			const graphqlLogger = requestLogger.child()
			return await withLogger(graphqlLogger, async () => {
				graphqlLogger.debug('Tenant query processing started', {
					body: request.body,
					query: request.query,
				})
				const context = this.tenantGraphQLContextFactory.create({ authResult, tenantContainer, koaContext, logger: requestLogger })

				await timer('GraphQL', () => groupContainer.tenantGraphQLHandler({
					request,
					response,
					context,
				}))
				graphqlLogger.debug('Tenant query finished')
			})
		}
	}
}
