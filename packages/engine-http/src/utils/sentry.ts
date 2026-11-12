import { LogEntry, LoggerHandler, LogLevel, LogLevelName, LogLevels } from '@contember/logger'
import { createSentryClient, installProcessHandlers, SentryClient, SeverityLevel } from '@contember/sentry-client'
import { LoggerRequestBody } from '../application/index.js'

const logLevelMapping: Record<LogLevelName, SeverityLevel> = {
	crit: 'fatal',
	error: 'error',
	warn: 'warning',
	debug: 'debug',
	info: 'info',
}

const stringAttribute = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined

export class SentryLoggerHandler implements LoggerHandler {
	constructor(
		private readonly logLevel: LogLevel,
		private readonly client: SentryClient,
	) {
	}

	getMinLevel(): number {
		return this.logLevel.value
	}

	handle(entry: LogEntry) {
		if (!entry.error || entry.level.value < this.logLevel.value) {
			return
		}
		const attribute = (name: string): string | undefined => stringAttribute(entry.loggerAttributes[name] ?? entry.ownAttributes[name])
		const traceId = stringAttribute(entry.loggerAttributes.traceId)
		const spanId = stringAttribute(entry.loggerAttributes.spanId)
		this.client.captureException(entry.error, {
			level: logLevelMapping[entry.level.name],
			tags: { project: attribute('project'), projectGroup: attribute('projectGroup'), module: attribute('module') },
			user: { id: attribute('user') },
			extra: { requestId: entry.loggerAttributes.requestId },
			request: { url: attribute('url'), data: entry.loggerAttributes[LoggerRequestBody] },
			...(traceId !== undefined && spanId !== undefined ? { contexts: { trace: { trace_id: traceId, span_id: spanId } } } : {}),
		})
	}

	close(): void {
	}
}

export interface SentryLoggerHandlerOptions {
	/** Reported as the SDK version; the client is released together with the server, so this is the server version. */
	readonly version?: string
}

/**
 * Reports logged errors (warn and up) and uncaught exceptions and unhandled rejections of the process.
 * Release and environment come from SENTRY_RELEASE and SENTRY_ENVIRONMENT. Nothing instruments outgoing requests, whose
 * URLs may carry a webhook credential.
 */
export const createSentryLoggerHandler = (dsn?: string, options: SentryLoggerHandlerOptions = {}): null | LoggerHandler => {
	if (!dsn) {
		return null
	}
	let client: SentryClient
	try {
		client = createSentryClient({
			dsn,
			release: process.env.SENTRY_RELEASE || undefined,
			environment: process.env.SENTRY_ENVIRONMENT || undefined,
			version: options.version,
		})
	} catch (error) {
		// as before: an invalid DSN turns reporting off instead of keeping the server from starting
		console.error(`${error instanceof Error ? error.message : String(error)}; errors are not reported to Sentry`)
		return null
	}
	installProcessHandlers(client)
	return new SentryLoggerHandler(LogLevels.warn, client)
}
