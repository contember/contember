import { KoaMiddleware, KoaRequestState } from '../koa/index.js'
import { AuthResult, TimerMiddlewareState } from '../common/index.js'
import { GraphQLKoaState } from '../graphql/index.js'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common/index.js'
import { TenantGraphQLContextFactory } from './TenantGraphQLContextFactory.js'

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
