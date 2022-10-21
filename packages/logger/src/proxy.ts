import { Logger, LoggerAttributes, LoggerHandler, LoggerOptions } from './types'
import { AsyncLocalStorage } from 'node:async_hooks'

const loggerStore = new AsyncLocalStorage<Logger>()

class CurrentLoggerProxy implements Logger {
	crit(a: any, b?: any, c?: any) {
		getLogger().crit(a, b)
	}

	error(a: any, b?: any, c?: any) {
		getLogger().error(a, b)
	}

	warn(a: any, b?: any, c?: any) {
		getLogger().warn(a, b)
	}

	info(a: any, b?: any, c?: any) {
		getLogger().info(a, b)
	}

	debug(a: any, b?: any, c?: any) {
		getLogger().debug(a, b)
	}

	child(attributes?: LoggerAttributes, options?: Partial<LoggerOptions>): Logger {
		return getLogger().child(attributes, options)
	}

	get attributes() {
		return getLogger().attributes
	}

	close(): void {
		getLogger().close()
	}

	scope<T>(cb: (logger: Logger) => (Promise<T> | T), attributes?: LoggerAttributes, options?: Partial<LoggerOptions>): Promise<T> {
		return getLogger().scope(cb, attributes, options)
	}

	addHandler(handler: LoggerHandler): void {
		getLogger().addHandler(handler)
	}
}

export const logger: Logger = new CurrentLoggerProxy()

export const withLogger = <R>(logger: Logger, callback: () => R): R => {
	return loggerStore.run(logger, callback)
}

export const getLogger = (): Logger => {
	const logger = loggerStore.getStore()
	if (!logger) {
		throw new Error('Logger was not set')
	}
	return logger
}
