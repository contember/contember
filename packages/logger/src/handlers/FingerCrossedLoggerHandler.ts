import { LogEntry, LoggerHandler, LoggerHandlerFactory, LogLevel } from '../types'
import { LogLevels } from '../levels'

export interface FingerCrossedLoggerHandlerOptions {
	logAlwaysLevel: LogLevel
	logWhenActivatedLevel: LogLevel
	activationLevel: LogLevel
	maxBufferSize: number
}

export class FingerCrossedLoggerHandler implements LoggerHandler {
	private buffer: LogEntry[] = []

	private active: boolean = false
	private options: FingerCrossedLoggerHandlerOptions

	constructor(
		private readonly inner: LoggerHandler,
		options: Partial<FingerCrossedLoggerHandlerOptions> = {},
	) {
		this.options = {
			logAlwaysLevel: LogLevels.info,
			logWhenActivatedLevel: LogLevels.debug,
			activationLevel: LogLevels.warn,
			maxBufferSize: 100,
			...options,
		}
		if (this.options.logAlwaysLevel.value < this.options.logWhenActivatedLevel.value) {
			this.options.logWhenActivatedLevel = this.options.logAlwaysLevel
		}
	}

	public static factory(options: Partial<FingerCrossedLoggerHandlerOptions> = {}): LoggerHandlerFactory {
		return (current, globalOptions) => new FingerCrossedLoggerHandler(current, { ...globalOptions.fingerCrossedOptions, ...options })
	}

	getMinLevel(): number {
		return this.options.logWhenActivatedLevel.value
	}


	handle(logEntry: LogEntry): void {
		const logEntryLevel = logEntry.level.value
		if (logEntryLevel < this.options.logWhenActivatedLevel.value) {
			return
		}

		if (this.active) {
			this.inner.handle(logEntry)

		} else if (logEntryLevel >= this.options.activationLevel.value) {
			this.active = true
			this.doFlush(this.options.logWhenActivatedLevel)
			this.inner.handle(logEntry)

		} else if (this.buffer.length === 0 && logEntryLevel >= this.options.logAlwaysLevel.value) {
			this.inner.handle(logEntry)

		} else {
			this.buffer.push(logEntry)

			if (this.buffer.length >= this.options.maxBufferSize) {
				const first = this.buffer.shift()
				if (first !== undefined && first.level.value >= this.options.logAlwaysLevel.value) {
					this.inner.handle(first)
				}
			}
		}
	}

	close(): void {
		this.doFlush(this.options.logAlwaysLevel)
		this.inner.close?.()
	}

	private doFlush(minLevel: LogLevel) {
		const entries = this.buffer
		this.buffer = []
		for (const entry of entries) {
			if (entry.level.value >= minLevel.value) {
				this.inner.handle(entry)
			}
		}
	}
}
