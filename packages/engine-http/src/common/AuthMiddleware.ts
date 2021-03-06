import { VerifyResult } from '@contember/engine-tenant-api'
import { KoaMiddleware } from '../koa'
import { ErrorResponseMiddlewareState } from './ErrorResponseMiddleware'
import { ApiKeyManagerState } from '../services'
import { TimerMiddlewareState } from './TimerMiddleware'

type InputState = ErrorResponseMiddlewareState & ApiKeyManagerState & TimerMiddlewareState

type KoaState = InputState & AuthMiddlewareState

const assumeIdentityHeader = 'x-contember-assume-identity'
export const createAuthMiddleware = (): KoaMiddleware<KoaState> => {
	const auth: KoaMiddleware<KoaState> = async (ctx, next) => {
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
		const authResult = await ctx.state.timer('Auth', () => ctx.state.apiKeyManager.verifyAndProlong(token))
		if (!authResult.ok) {
			return ctx.state.fail.authorizationFailure(authResult.errorMessage)
		}
		ctx.state.authResult = {
			...authResult.result,
			assumedIdentityId: ctx.request.get(assumeIdentityHeader) || undefined,
		}
		await next()
	}
	return auth
}

export interface AuthMiddlewareState {
	authResult: VerifyResult & { assumedIdentityId?: string }
}
