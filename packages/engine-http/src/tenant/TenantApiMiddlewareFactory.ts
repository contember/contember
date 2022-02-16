import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, TimerMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory'

type TenantApiMiddlewareState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
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
			const tenantContainer = groupContainer.tenantContainer
			const context = this.tenantGraphQLContextFactory.create({ authResult, tenantContainer, koaContext })
			return await groupContainer.tenantGraphQLHandler({
				request,
				response,
				context,
			})
		}
	}
}
