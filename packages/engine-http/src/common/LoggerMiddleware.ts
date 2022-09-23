import { KoaMiddleware } from '../koa'
import { FingerCrossedLoggerHandler, Logger } from '@contember/logger'

export interface LoggerMiddlewareState {
	logger: Logger
}

export const LoggerRequestSymbol = Symbol()

export const createLoggerMiddleware = (logger: Logger) => {
	const loggerMiddleware: KoaMiddleware<LoggerMiddlewareState> = async (ctx, next) => {
		return await logger.scope(async logger => {
			ctx.state.logger = logger
			logger.debug('Request processing started', {
				body: ctx.request.body,
				query: ctx.request.query,
			})
			try {
				return await next()
			} finally {
				logger.debug('Request processing finished')
			}
		}, {
			method: ctx.request.method,
			uri: ctx.request.originalUrl,
			requestId: Math.random().toString().substring(2),
			[LoggerRequestSymbol]: ctx.request,
		}, {
			handler: FingerCrossedLoggerHandler.factory(),
		})
	}
	return loggerMiddleware
}
