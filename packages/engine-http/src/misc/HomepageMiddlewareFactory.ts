import * as Koa from 'koa'
import { route } from '../koa'

export const createHomepageMiddleware = () => {
	return route('/$', (ctx: Koa.Context, next) => {
		ctx.body = 'App is running'
	})
}
