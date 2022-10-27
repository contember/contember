import { KoaMiddleware } from '../application'

export interface ModuleInfoMiddlewareState {
	module: string
}

export const createModuleInfoMiddleware = (module: string): KoaMiddleware<ModuleInfoMiddlewareState> => {
	return (ctx, next) => {
		ctx.state.module = module
		return next()
	}
}
