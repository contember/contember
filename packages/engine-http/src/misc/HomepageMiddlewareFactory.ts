import * as Koa from 'koa'
import { KoaMiddleware, route } from '../koa'

export const createHomepageMiddleware = (): KoaMiddleware<any> => {
	return (ctx: Koa.Context, next) => {
		ctx.body = 'App is running'
	}
}
