import * as Koa from 'koa'
import { route } from '../core/koa/router'

class HomepageMiddlewareFactory {
	create(): Koa.Middleware {
		return route('/$', (ctx: Koa.Context, next) => {
			ctx.body = 'App is running'
		})
	}
}

export default HomepageMiddlewareFactory
