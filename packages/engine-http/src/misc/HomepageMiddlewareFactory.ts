import * as Koa from 'koa'
import { route } from '../koa/index.js'

export const createHomepageMiddleware = () => {
	return route('/$', (ctx: Koa.Context, next) => {
		ctx.body = 'App is running'
	})
}
