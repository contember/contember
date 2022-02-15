import { VerifyResult } from '@contember/engine-tenant-api'
import { KoaContext, KoaMiddleware } from '../koa'
import { TimerMiddlewareState } from './TimerMiddleware'
import { ErrorFactory } from './ErrorFactory'
import { ProjectGroupState } from '../project-common'
import { HttpError } from './HttpError'

type InputState =
	& TimerMiddlewareState

type KoaState =
	& InputState
	& AuthMiddlewareState
	& ProjectGroupState

export interface AuthMiddlewareState {
	authResult: VerifyResult & { assumedIdentityId?: string }
}

const assumeIdentityHeader = 'x-contember-assume-identity'

export class AuthMiddlewareFactory {
	public create(): KoaMiddleware<KoaState> {
		const authError = (ctx: KoaContext<KoaState>, message: string) => new HttpError(`Authorization failure: ${message}`, 401)
		const auth: KoaMiddleware<KoaState> = async (ctx, next) => {
			const authHeader = ctx.request.get('Authorization')
			if (typeof authHeader !== 'string' || authHeader === '') {
				throw authError(ctx, `Authorization header is missing`)
			}

			const authHeaderPattern = /^Bearer\s+(\w+)$/i

			const match = authHeader.match(authHeaderPattern)
			if (match === null) {
				throw authError(ctx, `invalid Authorization header format`)
			}
			const [, token] = match
			const projectGroupContainer = ctx.state.projectGroupContainer
			const tenantDatabase = projectGroupContainer.tenantDatabase
			const tenantContainer = projectGroupContainer.tenantContainer
			const authResult = await ctx.state.timer('Auth', () => tenantContainer.apiKeyManager.verifyAndProlong(tenantDatabase, token))
			if (!authResult.ok) {
				throw authError(ctx, authResult.errorMessage)
			}
			ctx.state.authResult = {
				...authResult.result,
				assumedIdentityId: ctx.request.get(assumeIdentityHeader) || undefined,
			}
			await next()
		}
		return auth
	}
}
