import { LoggerHandler } from '../types'

export class NullLoggerHandler implements LoggerHandler {
	close(): void {
	}

	getMinLevel(): number {
		return Number.POSITIVE_INFINITY
	}

	handle(): void {
	}
}
