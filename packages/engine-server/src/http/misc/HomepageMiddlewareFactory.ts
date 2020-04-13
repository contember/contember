import * as Koa from 'koa'
import { route } from '../../core/koa'

export const createHomepageMiddleware = () => {
	return route('/$', (ctx: Koa.Context, next) => {
		ctx.body = 'App is running'
	})
}
