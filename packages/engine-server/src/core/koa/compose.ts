import { KoaMiddleware } from './types'
import Koa from 'koa'

export function compose(
	middlewares: (KoaMiddleware<any> | Koa.Middleware)[],
	debug: boolean = false,
): KoaMiddleware<any> {
	return async (context, mainNext) => {
		let next = mainNext
		for (let i = middlewares.length - 1; i >= 0; i--) {
			const fn = middlewares[i]
			next = fn.bind(null, context, next)
			if (debug) {
				next = context.state.timer.bind(null, fn.name || 'unnamed middleware', next)
			}
		}
		return await next()
	}
}
