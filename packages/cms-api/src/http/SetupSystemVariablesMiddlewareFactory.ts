import { KoaMiddleware } from '../core/koa/types'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { setupSystemVariables as setupSystemVariablesFn } from '@contember/engine-system-api'

type InputState = DatabaseTransactionMiddlewareFactory.KoaState & AuthMiddlewareFactory.KoaState

class SetupSystemVariablesMiddlewareFactory {
	constructor(private readonly providers: { uuid: () => string }) {}

	public create(): KoaMiddleware<InputState> {
		const setupSystemVariables: KoaMiddleware<InputState> = async (ctx, next) => {
			await setupSystemVariablesFn(ctx.state.db, ctx.state.authResult.identityId, this.providers)
			await next()
		}
		return setupSystemVariables
	}
}

export default SetupSystemVariablesMiddlewareFactory
