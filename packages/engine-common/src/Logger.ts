import { AsyncLocalStorage } from 'node:async_hooks'
import { inspect } from 'node:util'
import chalk from 'chalk'

export type Attributes = Record<string | symbol, any>

export type LogLevel = { name: string; value: number }

export const LogLevels = {
	debug: { name: 'debug', value: 10 },
	info: { name: 'info', value: 20 },
	warn: { name: 'warn', value: 30 },
	error: { name: 'error', value: 40 },
	crit: { name: 'crit', value: 50 },

}
export type LogFn =
	& ((message: string, attributes?: Attributes) => void)
	& ((error: unknown, attributes?: Attributes) => void)
	& ((error: unknown, message?: string | null, attributes?: Attributes) => void)

export type LogEntry = {
	level: LogLevel
	time: Date
	isoTime: string
	message: string
	error?: unknown
	attributes?: Attributes
}

export type LogEntryBag = {
	base: LogEntry
	loggerAttributes: Attributes
	indent: number
	formattedAttributes: string
	formattedMessage: string
	formattedError: string
}

export interface LoggerOptions {
	fingersCrossedLogLevel?: LogLevel
	logLevel?: LogLevel
}

export const createLogger = (
	attributes: Attributes = {},
	options: Partial<LoggerOptions> = {}) => {
	return LoggerImpl.create(attributes, options)
}


export interface Logger {
	crit: LogFn
	error: LogFn
	warn: LogFn
	info: LogFn
	debug: LogFn

	child(attributes?: Attributes, options?: Partial<LoggerOptions>): Logger
}

export class LoggerImpl {
	private readonly fingersCrossedLogLevel: LogLevel
	private readonly logLevel: LogLevel

	private readonly allAttributes: Attributes
	private fingersCrossedBuffer: LogEntry[] = []
	private formattedAttributes: FormattedAttributes | undefined

	public readonly crit: LogFn = (a: string | unknown, b?: null | string | Attributes, c?: Attributes) => {
		this.fingersCrossedLogLevel.value <= LogLevels.crit.value && this.log(LogLevels.crit, a, b, c)
	}
	public readonly error: LogFn = (a: string | unknown, b?: null | string | Attributes, c?: Attributes) => {
		this.fingersCrossedLogLevel.value <= LogLevels.error.value && this.log(LogLevels.error, a, b, c)
	}
	public readonly warn: LogFn = (a: string | unknown, b?: null | string | Attributes, c?: Attributes) => {
		this.fingersCrossedLogLevel.value <= LogLevels.warn.value && this.log(LogLevels.warn, a, b, c)
	}
	public readonly info: LogFn = (a: string | unknown, b?: null | string | Attributes, c?: Attributes) => {
		this.fingersCrossedLogLevel.value <= LogLevels.info.value && this.log(LogLevels.info, a, b, c)
	}
	public readonly debug: LogFn = (a: string | unknown, b?: null | string | Attributes, c?: Attributes) => {
		this.fingersCrossedLogLevel.value <= LogLevels.debug.value && this.log(LogLevels.debug, a, b, c)
	}

	private constructor(
		private readonly transport: TransportList,
		private readonly ownAttributes: Attributes,
		private readonly indent: number,
		options: LoggerOptions,
		private readonly parent: LoggerImpl | undefined,
	) {
		this.allAttributes = { ...parent?.allAttributes, ...ownAttributes }
		this.logLevel = options.logLevel ?? parent?.logLevel ?? LogLevels.info
		this.fingersCrossedLogLevel = options.fingersCrossedLogLevel ?? parent?.fingersCrossedLogLevel ?? LogLevels.debug
		if (this.fingersCrossedLogLevel.value > this.logLevel.value) {
			this.fingersCrossedLogLevel = this.logLevel
		}
	}

	public addTransport(transport: LoggerTransport) {
		this.transport.addTransport(transport)
	}

	public static create(
		attributes: Attributes = {},
		options: Partial<LoggerOptions> = {},
	) {
		return new LoggerImpl(new TransportList(), attributes, 0, options, undefined)
	}

	public child(attributes: Attributes = {}, options: Partial<LoggerOptions> = {}): Logger {
		return new LoggerImpl(this.transport, attributes, this.indent + 1, options, this)
	}

	private log(level: LogLevel, errorOrMessage: unknown, messageOrAttributes: unknown, attributesOpt: unknown) {
		let error: unknown | undefined
		let message: string
		let attributes: Attributes | undefined
		if (typeof errorOrMessage === 'string') {
			error = undefined
			message = errorOrMessage
			attributes = typeof messageOrAttributes === 'object' && messageOrAttributes !== null
				? messageOrAttributes as Attributes
				: undefined
		} else {
			error = errorOrMessage
			message = typeof messageOrAttributes === 'string'
				? messageOrAttributes
				: typeof error === 'object' && error !== null && 'message' in error && typeof ((error as any).message === 'string')
					? (error as any).message
					: 'unknown error'

			attributes = typeof attributesOpt === 'object' && attributesOpt !== null
				? attributesOpt
				: typeof messageOrAttributes === 'object' && messageOrAttributes !== null
					? messageOrAttributes
					: undefined
		}
		const now = new Date()
		const entry: LogEntry = { level, error, message, attributes, time: now, isoTime: now.toISOString() }
		if (this.logLevel.value <= level.value) {
			this.flushBuffer(entry.level)
			this.transport.dispatch(this.formatEntry(entry))
		} else {
			this.fingersCrossedBuffer.push(entry)
		}
	}

	private flushBuffer(level: LogLevel) {
		this.parent?.flushBuffer(level)
		if (this.fingersCrossedBuffer.length > 0 && this.logLevel.value <= level.value) {
			const buffer = this.fingersCrossedBuffer
			this.fingersCrossedBuffer = []
			for (const buffered of buffer) {
				this.transport.dispatch(this.formatEntry(buffered))
			}
		}
	}

	private formatEntry(entry: LogEntry): LogEntryBag {
		const attributes = this.getFormattedAttributes()

		return {
			base: entry,
			loggerAttributes: this.allAttributes,
			indent: this.indent,
			formattedAttributes: formatLogEntryAttributes(attributes, entry),
			formattedMessage: stringify(entry.message),
			formattedError: entry.error ? `, "error": ${stringify(entry.error)}` : '',
		}
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

export type FormattedAttributes = {
	formattedAttributes: Attributes
	formattedLine: string
}

const formatLoggerAttributes = (parentAttributes: FormattedAttributes | undefined, ownAttributes: Attributes): FormattedAttributes => {
	const formattedAttributes: Record<string, string> = {}
	let formattedLine = ''
	for (const key in ownAttributes) {
		const formattedKey = stringify(key)
		const value = ownAttributes[key]
		if (value === undefined) {
			continue
		}
		const formattedValue = stringify(value)
		formattedAttributes[formattedKey] = formattedValue
		formattedLine += `, ${formattedKey}: ${formattedValue}`
	}
	const parentFormattedAttributes = parentAttributes?.formattedAttributes
	for (const key in parentFormattedAttributes) {
		if (!(key in formattedAttributes)) {
			const formattedValue = parentFormattedAttributes[key]
			formattedAttributes[key] = formattedValue
			formattedLine += `, ${key}: ${formattedValue}`
		}
	}
	return { formattedAttributes, formattedLine }
}

const formatLogEntryAttributes = (attributes: FormattedAttributes, entry: LogEntry): string => {
	let entryAttributes = ''
	let reformatRest = false
	const omitInRest: Record<string, boolean> = {}

	for (const key in entry.attributes) {
		const formattedKey = stringify(key)
		const value = entry.attributes[key]
		if (value === undefined) {
			continue
		}
		const formattedValue = stringify(value)
		entryAttributes += `, ${formattedKey}: ${formattedValue}`
		if (key in attributes.formattedAttributes) {
			reformatRest = true
			omitInRest[formattedKey] = true
		}
	}
	if (reformatRest) {
		for (const key in attributes.formattedAttributes) {
			if (!(key in omitInRest)) {
				entryAttributes += `, ${key}: ${attributes.formattedAttributes[key]}`
			}
		}
	} else {
		entryAttributes += attributes.formattedLine
	}

	return entryAttributes
}

const stringify = (value: unknown) => {
	try {
		return JSON.stringify(value)
	} catch {
		return JSON.stringify(inspect(value))
	}
}


export interface LoggerTransport {
	dispatch(logEntry: LogEntryBag): void
}

export class JsonStreamTransport implements LoggerTransport {
	constructor(
		private readonly stream: NodeJS.WritableStream,
	) {
	}

	dispatch(entry: LogEntryBag): void {
		const line = `{"time": "${entry.base.isoTime}", "level": "${entry.base.level.name}", "message": ${entry.formattedMessage}${entry.formattedError}${entry.formattedAttributes}}\n`
		this.stream.write(line)
	}
}

export class PrettyPrintTransport implements LoggerTransport {
	constructor(
		private readonly stream: NodeJS.WritableStream,
	) {
	}

	dispatch(entry: LogEntryBag) {
		const startLength = entry.base.isoTime.length + 7

		this.stream.write(`${this.formatTime(entry.base.isoTime)} ${this.formatLevel(entry.base.level)} `)

		const indent = ' '.repeat(startLength)
		this.stream.write(`${entry.base.message.replaceAll(/\n/g, '\n' + indent)}\n`)
		this.stream.write(chalk.dim(`${indent}${inspect({ ...entry.base.attributes, ...entry.loggerAttributes }, {
			breakLength: Infinity,
			maxStringLength: Infinity,
		})}\n`))
		if (entry.base.error) {
			this.stream.write(inspect(entry.base.error).replaceAll(/^/gm, indent) + '\n')
		}
	}

	private formatTime(date: string): string {
		const result = date.match(/^([0-9-]+)T([0-9:]+)\.(\d+)Z$/)
		if (!result) {
			return date
		}
		return chalk.dim(result[1] + 'T') + result[2] + chalk.dim('.' + result[3] + 'Z')
	}

	private formatLevel(level: LogLevel): string {
		const levelText = `${level.name}${' '.repeat(5 - level.name.length)}`
		let color: chalk.Chalk = chalk
		if (level.value <= 10) {
			color = color.dim
		} else if (level.value <= 20) {
			// nothhing
		} else if (level.value <= 30) {
			color = color.yellowBright
		} else {
			color = color.redBright
		}
		return color(levelText)
	}
}

export class TransportList implements LoggerTransport {

	constructor(
		private readonly transports: LoggerTransport[] = [],
	) {
	}

	public addTransport(transport: LoggerTransport) {
		this.transports.push(transport)
	}

	dispatch(logEntry: LogEntryBag) {
		for (const transport of this.transports) {
			transport.dispatch(logEntry)
		}
	}
}

class CurrentLoggerProxy implements Logger {
	crit(a: any, b?: any, c?: any) {
		getLogger().crit(a, b, c)
	}

	error(a: any, b?: any, c?: any) {
		getLogger().error(a, b, c)
	}

	warn(a: any, b?: any, c?: any) {
		getLogger().warn(a, b, c)
	}

	info(a: any, b?: any, c?: any) {
		getLogger().info(a, b, c)
	}

	debug(a: any, b?: any, c?: any) {
		getLogger().crit(a, b, c)
	}

	child(attributes?: Attributes, options?: Partial<LoggerOptions>): Logger {
		return getLogger().child(attributes, options)
	}
}

const createLoggerProxy = (): Logger => new CurrentLoggerProxy()

export const logger: Logger = createLoggerProxy()

const loggerStore = new AsyncLocalStorage<Logger>()

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
