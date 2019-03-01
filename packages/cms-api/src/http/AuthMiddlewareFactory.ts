import ApiKeyManager from '../tenant-api/model/service/ApiKeyManager'
import { KoaContext, KoaMiddleware } from '../core/koa/types'
import { createGraphqlInvalidAuthResponse } from './responseUtils'

class AuthMiddlewareFactory {
	constructor(private apiKeyManager: ApiKeyManager) {
	}

	create(): KoaMiddleware<AuthMiddlewareFactory.KoaState> {
		const auth: KoaMiddleware<AuthMiddlewareFactory.KoaState> = async (ctx, next) => {
			const authHeader = ctx.request.get('Authorization')
			if (typeof authHeader !== 'string') {
				return createGraphqlInvalidAuthResponse(ctx, `Auth failure: Authorization header is missing`)
			}

			const authHeaderPattern = /^Bearer\s+(\w+)$/i

			const match = authHeader.match(authHeaderPattern)
			if (match === null) {
				return createGraphqlInvalidAuthResponse(ctx, `Auth failure: invalid Authorization header format`)
			}
			const [, token] = match
			const authResult = await this.apiKeyManager.verifyAndProlong(token)
			if (!authResult.valid) {
				return createGraphqlInvalidAuthResponse(ctx, `Auth failure: ${authResult.error}`)
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

export default AuthMiddlewareFactory
