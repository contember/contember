import { LoggerHandler } from '../types.js'

export class NullLoggerHandler implements LoggerHandler {
	close(): void {
	}

	getMinLevel(): number {
		return Number.POSITIVE_INFINITY
	}

	handle(): void {
	}
}
