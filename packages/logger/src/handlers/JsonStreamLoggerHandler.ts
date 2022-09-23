import { LogEntry, LoggerHandler, LogLevel } from '../types'
import { LogLevels } from '../levels'

export interface JsonStreamLoggerHandlerOptions {
	logLevel: LogLevel
}

export class JsonStreamLoggerHandler implements LoggerHandler {
	private options: JsonStreamLoggerHandlerOptions

	constructor(
		private readonly stream: NodeJS.WritableStream,
		options: Partial<JsonStreamLoggerHandlerOptions> = {},
	) {
		this.options = {
			logLevel: LogLevels.debug,
			...options,
		}
	}

	handle(entry: LogEntry): void {
		if (entry.level.value < this.options.logLevel.value) {
			return
		}
		const formatted = entry.format()
		const line = `{"time": "${entry.isoTime}", "level": "${entry.level.name}", "message": ${formatted.message}${formatted.error}${formatted.attributes}}\n`
		this.stream.write(line)
	}

	getMinLevel(): number {
		return this.options.logLevel.value
	}

	close(): void {
	}
}
