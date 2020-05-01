import { ApiKeyManager } from '@contember/engine-tenant-api'
import { KoaContext, KoaMiddleware } from '../core/koa'
import { ErrorResponseMiddlewareState } from './ErrorResponseMiddlewareFactory'
import { TimerMiddlewareFactory } from './TimerMiddlewareFactory'

class AuthMiddlewareFactory {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	create(): KoaMiddleware<
		ErrorResponseMiddlewareState & AuthMiddlewareFactory.KoaState & TimerMiddlewareFactory.KoaState
	> {
		const auth: KoaMiddleware<ErrorResponseMiddlewareState &
			AuthMiddlewareFactory.KoaState &
			TimerMiddlewareFactory.KoaState> = async (ctx, next) => {
			const authHeader = ctx.request.get('Authorization')
			if (typeof authHeader !== 'string' || authHeader === '') {
				return ctx.state.fail.authorizationFailure(`Authorization header is missing`)
			}

			const authHeaderPattern = /^Bearer\s+(\w+)$/i

			const match = authHeader.match(authHeaderPattern)
			if (match === null) {
				return ctx.state.fail.authorizationFailure(`invalid Authorization header format`)
			}
			const [, token] = match
			const authResult = await ctx.state.timer('Auth', () => this.apiKeyManager.verifyAndProlong(token))
			if (!authResult.valid) {
				return ctx.state.fail.authorizationFailure(authResult.error)
			}
			ctx.state.authResult = authResult
			await next()
		}
		return auth
	}
}

namespace AuthMiddlewareFactory {
	export type ContextWithAuth = KoaContext<KoaState>
	export type KoaState = {
		authResult: ApiKeyManager.VerifyResultOk
	}
}

export { AuthMiddlewareFactory }
