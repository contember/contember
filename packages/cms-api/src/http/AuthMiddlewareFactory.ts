import ApiKeyManager from '../tenant-api/model/service/ApiKeyManager'
import * as Koa from 'koa'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'

class AuthMiddlewareFactory {
	constructor(private apiKeyManager: ApiKeyManager) {}

	create(): Koa.Middleware {
		return async (ctx: TimerMiddlewareFactory.ContextWithTimer & AuthMiddlewareFactory.ContextWithAuth, next) => {
			const authHeader = ctx.request.get('Authorization')
			if (typeof authHeader !== 'string') {
				return await next()
			}

			const authHeaderPattern = /^Bearer\s+(\w+)$/i

			const match = authHeader.match(authHeaderPattern)
			if (match === null) {
				return await next()
			}

			const [, token] = match
			ctx.state.timer('fetching auth token info')
			ctx.state.authResult = await this.apiKeyManager.verifyAndProlong(token)
			ctx.state.timer('done')
			await next()
		}
	}
}

namespace AuthMiddlewareFactory {
	export type ContextWithAuth = Pick<Koa.Context, Exclude<keyof Koa.Context, 'state'>> & {
		state: {
			authResult?: ApiKeyManager.VerifyResult
		}
	}
}

export default AuthMiddlewareFactory
