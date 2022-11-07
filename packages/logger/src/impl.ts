import {
	LogEntry,
	LogEntryFormatted,
	Logger,
	LoggerAttributes,
	LoggerChildOptions,
	LoggerHandler,
	LoggerOptions,
	LogLevel,
} from './types'
import { LogLevels } from './levels'
import { formatLogEntryAttributes, formatLoggerAttributes, FormattedAttributes, stringify } from './formatting'
import { LoggerHandlerList } from './handlers/LoggerHandlerList'
import { withLogger } from './proxy'

export const createLogger = (
	handler: LoggerHandler,
	attributes: LoggerAttributes = {},
	options: LoggerOptions = {},
): Logger => {
	return LoggerImpl.create(handler, attributes, options)
}


export class LoggerImpl implements Logger {

	public readonly attributes: LoggerAttributes
	private formattedAttributes: FormattedAttributes | undefined
	private minLevelValue: number
	private handlerList: LoggerHandlerList | undefined

	private constructor(
		private handler: LoggerHandler,
		private readonly ownAttributes: LoggerAttributes,
		private readonly depth: number,
		private readonly parent: LoggerImpl | undefined,
		private readonly options: LoggerOptions,
	) {
		this.attributes = { ...parent?.attributes, ...ownAttributes }
		this.minLevelValue = handler.getMinLevel()
	}

	public static create(
		handler: LoggerHandler,
		attributes: LoggerAttributes = {},
		options: LoggerOptions = {},
	) {
		return new LoggerImpl(handler, attributes, 0, undefined, options)
	}

	public crit(messageOrError: unknown, attributes?: LoggerAttributes) {
		this.minLevelValue <= LogLevels.crit.value && this.log(LogLevels.crit, messageOrError, attributes)
	}

	public error(messageOrError: unknown, attributes?: LoggerAttributes) {
		this.minLevelValue <= LogLevels.error.value && this.log(LogLevels.error, messageOrError, attributes)
	}

	public warn(messageOrError: unknown, attributes?: LoggerAttributes) {
		this.minLevelValue <= LogLevels.warn.value && this.log(LogLevels.warn, messageOrError, attributes)
	}

	public info(messageOrError: unknown, attributes?: LoggerAttributes) {
		this.minLevelValue <= LogLevels.info.value && this.log(LogLevels.info, messageOrError, attributes)
	}

	public debug(messageOrError: unknown, attributes?: LoggerAttributes) {
		this.minLevelValue <= LogLevels.debug.value && this.log(LogLevels.debug, messageOrError, attributes)
	}

	public child(attributes: LoggerAttributes = {}, options: Partial<LoggerChildOptions> = {}): Logger {
		const newHandler = options.handler ? options.handler(this.handler, this.options) : this.handler
		return new LoggerImpl(newHandler, attributes, this.depth + 1, this, { ...this.options, ...options })
	}

	public async scope<T>(cb: (logger: Logger) => Promise<T> | T, attributes: LoggerAttributes = {}, options: Partial<LoggerChildOptions> = {}): Promise<T> {
		const logger = this.child(attributes, options)
		try {
			return await withLogger(logger, () => cb(logger))
		} finally {
			logger.close()
		}
	}

	private log(level: LogLevel, errorOrMessage: unknown, { error: errorAttr, message: messageAttr, ...attributes }: LoggerAttributes = {}) {
		const error: unknown | undefined = typeof errorOrMessage !== 'string' ? errorOrMessage : errorAttr
		const errorMessage = typeof error === 'object' && error !== null && typeof (error as any).message === 'string'
			? (error as any).message : undefined

		const passedMessage = typeof errorOrMessage === 'string'
			? errorOrMessage
			: (typeof messageAttr === 'string')
				? messageAttr
				: undefined

		const message = errorMessage && passedMessage ? `${passedMessage}: ${errorMessage}` : (passedMessage ?? errorMessage ?? 'undefined message')

		const now = new Date()
		let formatted: LogEntryFormatted
		const entry: LogEntry = {
			level,
			error,
			message,
			ownAttributes: attributes,
			time: now,
			isoTime: now.toISOString(),
			depth: this.depth,
			loggerAttributes: this.attributes,
			format: () => {
				return formatted ??= {
					attributes: formatLogEntryAttributes(this.getFormattedAttributes(), entry),
					message: stringify(entry.message),
					error: entry.error ? `, "error": ${stringify(entry.error)}` : '',
				}
			},
		}
		this.handler.handle(entry)
	}

	addHandler(handler: LoggerHandler): void {
		if (!this.handlerList) {
			this.handlerList = new LoggerHandlerList([this.handler])
			this.handler = this.handlerList
		}
		this.handlerList.addHandler(handler)
		this.minLevelValue = Math.min(this.minLevelValue, handler.getMinLevel())
	}

	close(): void {
		this.handler.close()
	}

	private getFormattedAttributes(): FormattedAttributes {
		if (this.formattedAttributes) {
			return this.formattedAttributes
		}
		const parentAttributes = this.parent?.getFormattedAttributes()
		this.formattedAttributes = formatLoggerAttributes(parentAttributes, this.ownAttributes)
		return this.formattedAttributes
	}
}



