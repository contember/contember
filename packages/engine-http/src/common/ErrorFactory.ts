import { KoaContext } from '../koa'
import { AuthMiddlewareState } from './AuthMiddleware'

export class ErrorFactory {
	constructor(
		private readonly debug: boolean,
	) {
	}

	createError(ctx: KoaContext<Partial<AuthMiddlewareState>>, message: string, code: number) {
		ctx.set('Content-type', 'application/json')
		ctx.status = code
		const body: any = { errors: [{ message, code }] }
		if (this.debug && ctx.state.authResult) {
			body.identity = {
				roles: ctx.state.authResult.roles,
			}
		}
		ctx.body = JSON.stringify(body)
	}
}
