import ContentMiddlewareFactoryMiddlewareFactory from './ContentMiddlewareFactoryMiddlewareFactory'
import * as Koa from 'koa'

export default class ContentMiddlewareFactory {
	create(): Koa.Middleware {
		return async (ctx: ContentMiddlewareFactoryMiddlewareFactory.ContextWithContentMiddleware, next) => {
			if (typeof ctx.state.contentServer !== 'undefined') {
				await ctx.state.contentServer(ctx, next)
			} else {
				await next()
			}
		}
	}
}
