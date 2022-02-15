import { KoaMiddleware } from '../koa'
import { HttpError } from './HttpError'
import { AuthMiddlewareState } from './AuthMiddleware'

export class ErrorMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
	) {
	}

	public create(): KoaMiddleware<AuthMiddlewareState> {
		return async (ctx, next) => {
			try {
				await next()
			} catch (e) {
				if (e instanceof HttpError) {
					ctx.set('Content-type', 'application/json')
					ctx.status = e.code
					const body: any = { errors: [{ message: e.message, code: e.code }] }
					if (this.debug && ctx.state.authResult) {
						body.identity = {
							roles: ctx.state.authResult.roles,
						}
					}
					ctx.body = JSON.stringify(body)
				} else {
					throw e
				}
			}
		}
	}
}
