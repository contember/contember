import { KoaMiddleware } from '../core/koa/types'
import DatabaseTransactionMiddlewareFactory from './DatabaseTransactionMiddlewareFactory'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { setupSystemVariables as setupSystemVariablesFn } from '../system-api/SystemVariablesSetupHelper'

type InputState = DatabaseTransactionMiddlewareFactory.KoaState & AuthMiddlewareFactory.KoaState

class SetupSystemVariablesMiddlewareFactory {
	public create(): KoaMiddleware<InputState> {
		const setupSystemVariables: KoaMiddleware<InputState> = async (ctx, next) => {
			await setupSystemVariablesFn(ctx.state.db, ctx.state.authResult.identityId)
			await next()
		}
		return setupSystemVariables
	}
}

export default SetupSystemVariablesMiddlewareFactory
