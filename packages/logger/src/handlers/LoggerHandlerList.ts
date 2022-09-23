import { LogEntry, LoggerHandler } from '../types'

export class LoggerHandlerList implements LoggerHandler {
	constructor(
		private readonly transports: LoggerHandler[] = [],
	) {
	}

	getMinLevel(): number {
		return Math.min(Number.MAX_SAFE_INTEGER, ...this.transports.map(it => it.getMinLevel()))
	}

	public addHandler(transport: LoggerHandler) {
		this.transports.push(transport)
	}

	handle(logEntry: LogEntry) {
		for (const transport of this.transports) {
			transport.handle(logEntry)
		}
	}

	close(): void {
		for (const transport of this.transports) {
			transport.close()
		}
	}
}
