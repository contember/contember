import { KoaMiddleware } from '../koa'

export const createModuleInfoMiddleware = (module: string): KoaMiddleware<ModuleInfoMiddlewareState> => {
	return (ctx, next) => {
		ctx.state.module = module
		return next()
	}
}

export interface ModuleInfoMiddlewareState {
	module: string
}
