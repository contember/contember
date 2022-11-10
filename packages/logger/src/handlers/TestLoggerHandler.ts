import { LogEntry, LoggerHandler } from '../types'

export class TestLoggerHandler implements LoggerHandler {
	public readonly messages: LogEntry[] = []


	constructor(
		private print = false,
	) {
	}

	close(): void {
	}

	getMinLevel(): number {
		return 0
	}

	handle(logEntry: LogEntry): void {
		this.messages.push(logEntry)
		if (this.print) {
			// eslint-disable-next-line no-console
			console.error(logEntry.message)
		}
	}
}
