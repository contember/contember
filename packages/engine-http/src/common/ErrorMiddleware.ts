import { KoaMiddleware } from '../koa'
import { HttpError } from './HttpError'
import { AuthResult } from './Authorizator'
import { LoggerMiddlewareState } from './LoggerMiddleware'

export class ErrorMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
	) {
	}

	public create(): KoaMiddleware<{ authResult?: AuthResult } & LoggerMiddlewareState> {
		return async (ctx, next) => {
			try {
				await next()
			} catch (e) {
				ctx.set('Content-type', 'application/json')
				if (e instanceof HttpError) {
					ctx.status = e.code
					const body: any = { errors: [{ message: e.message, code: e.code }] }
					if (this.debug && ctx.state.authResult) {
						body.identity = {
							roles: ctx.state.authResult.roles,
						}
					}
					ctx.body = JSON.stringify(body)
				} else {
					ctx.status = 500
					ctx.body = JSON.stringify({ errors: [{ message: 'Internal server error' }] })
					ctx.state.logger.error(e)
				}
			}
		}
	}
}
