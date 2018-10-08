import ApiKeyManager from '../tenant-api/model/service/ApiKeyManager'
import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'

class AuthMiddlewareFactory {
	constructor(private apiKeyManager: ApiKeyManager) {}

	create(): koaCompose.Middleware<AuthMiddlewareFactory.ContextWithAuth> {
		return async (ctx, next) => {
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
			ctx.state.authResult = await this.apiKeyManager.verify(token)
			await next()
		}
	}
}

namespace AuthMiddlewareFactory {
	export type ContextWithAuth = Koa.Context & {
		state: {
			authResult?: ApiKeyManager.VerifyResult
		}
	}
}

export default AuthMiddlewareFactory
