import { AuthResult, GraphQLKoaState, KoaMiddleware, KoaRequestState, LoggerMiddlewareState, ProjectContextResolver, ProjectInfoMiddlewareState, TimerMiddlewareState } from '@contember/engine-http'
import { ActionsGraphQLHandler } from './ActionsGraphQLHandlerFactory'
declare type SystemApiMiddlewareKoaState = TimerMiddlewareState & KoaRequestState & GraphQLKoaState & ProjectInfoMiddlewareState & LoggerMiddlewareState & {
	authResult: AuthResult
}
export declare class ActionsApiMiddlewareFactory {
	private readonly debug
	private readonly projectContextResolver
	private readonly actionsGraphQLHandler
	constructor(debug: boolean, projectContextResolver: ProjectContextResolver, actionsGraphQLHandler: ActionsGraphQLHandler)
	create(): KoaMiddleware<SystemApiMiddlewareKoaState>
}
export {}
//# sourceMappingURL=ActionsApiMiddlewareFactory.d.ts.map
