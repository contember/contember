import * as Koa from 'koa'
import { route } from '../core/koa'

export class HomepageMiddlewareFactory {
	create(): Koa.Middleware {
		return route('/$', (ctx: Koa.Context, next) => {
			ctx.body = 'App is running'
		})
	}
}
