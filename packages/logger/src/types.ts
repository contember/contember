import { FingerCrossedLoggerHandlerOptions } from './handlers/FingerCrossedLoggerHandler'

export type LogFn = ((errorOrMessage: unknown, attributes?: LoggerAttributes) => void)

export interface Logger {
	attributes: LoggerAttributes

	crit: LogFn
	error: LogFn
	warn: LogFn
	info: LogFn
	debug: LogFn

	child(attributes?: LoggerAttributes, options?: Partial<LoggerChildOptions>): Logger
	scope<T>(cb: (logger: Logger) => Promise<T> | T, attributes?: LoggerAttributes, options?: Partial<LoggerChildOptions>): Promise<T>
	close(): void

	addHandler(handler: LoggerHandler): void
}

export interface LoggerHandler {
	getMinLevel(): number
	handle(logEntry: LogEntry): void
	close(): void
}

export type LoggerAttributes = {
	error?: unknown
	message?: string
} & {
	[key: string | symbol]: any
}

export type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'crit'

export type LogLevel = { name: LogLevelName; value: number }

export type LogEntry = {
	level: LogLevel
	time: Date
	isoTime: string
	message: string
	error?: unknown
	ownAttributes: LoggerAttributes
	loggerAttributes: LoggerAttributes
	depth: number
	format: () => LogEntryFormatted
}
export type LogEntryFormatted = { attributes: string; message: string; error: string }

export type LoggerHandlerFactory = (current: LoggerHandler, globalOptions: LoggerOptions) => LoggerHandler

export interface LoggerOptions {
	fingerCrossedOptions?: Partial<FingerCrossedLoggerHandlerOptions>
}

export interface LoggerChildOptions extends LoggerOptions {
	handler?: LoggerHandlerFactory
}
