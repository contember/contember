import { KoaMiddleware } from '../../core/koa'
import { DebugInfoMiddlewareState } from './DebugInfoMiddleware'
import { AuthMiddlewareState } from './AuthMiddleware'

type KoaState = ErrorResponseMiddlewareState & Partial<AuthMiddlewareState> & DebugInfoMiddlewareState

export const createErrorResponseMiddleware = () => {
	const errorResponse: KoaMiddleware<KoaState> = (ctx, next) => {
		const createError = (message: string, code: number) => {
			ctx.set('Content-type', 'application/json')
			ctx.status = code
			const body: any = { errors: [{ message, code }] }
			if (ctx.state.debug && ctx.state.authResult) {
				body.identity = {
					roles: ctx.state.authResult.roles,
				}
			}
			ctx.body = JSON.stringify(body)
		}
		ctx.state.fail = {
			authorizationFailure: (message: string) => createError(`Authorization failure: ${message}`, 401),
			projectNotFound: (projectSlug: string) => createError(`Project ${projectSlug} NOT found`, 404),
			projectForbidden: (projectSlug: string) =>
				ctx.state.debug
					? createError(`You are not allowed to access project ${projectSlug}`, 403)
					: createError(`Project ${projectSlug} NOT found`, 404),
		}
		return next()
	}
	return errorResponse
}

export interface ErrorResponseMiddlewareState {
	fail: {
		authorizationFailure: (message: string) => void
		projectNotFound: (projectSlug: string) => void
		projectForbidden: (projectSlug: string) => void
	}
}
