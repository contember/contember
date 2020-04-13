import { KoaMiddleware } from '../../core/koa'

export const createDebugInfoMiddleware = (debug: boolean): KoaMiddleware<DebugInfoMiddlewareState> => {
	const debugInfoMiddleware: KoaMiddleware<DebugInfoMiddlewareState> = (ctx, next) => {
		ctx.state.debug = debug
		return next()
	}
	return debugInfoMiddleware
}

export interface DebugInfoMiddlewareState {
	debug: boolean
}
