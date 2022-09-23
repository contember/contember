import { KoaMiddleware } from '../koa'
import { Logger } from '@contember/engine-common'

export interface LoggerMiddlewareState {
	logger: Logger
}

export const LoggerRequestSymbol = Symbol()

export const createLoggerMiddleware = (logger: Logger) => {
	const loggerMiddleware: KoaMiddleware<LoggerMiddlewareState> = (ctx, next) => {
		ctx.state.logger = logger.child({
			method: ctx.request.method,
			uri: ctx.request.originalUrl,
			[LoggerRequestSymbol]: ctx.request,
		})
		return next()
	}
	return loggerMiddleware
}
