import * as Sentry from '@sentry/node'
import { LogEntry, LoggerHandler, LogLevel, LogLevelName, LogLevels } from '@contember/logger'
import { LoggerRequestBody } from '../application/index.js'

const logLevelMapping: Record<LogLevelName, Sentry.SeverityLevel> = {
	crit: 'fatal',
	error: 'error',
	warn: 'warning',
	debug: 'debug',
	info: 'info',
}

export class SentryLoggerHandler implements LoggerHandler {
	constructor(
		private readonly logLevel: LogLevel,
	) {
	}

	getMinLevel(): number {
		return this.logLevel.value
	}

	handle(entry: LogEntry) {
		if (!entry.error || entry.level.value < this.logLevel.value) {
			return
		}
		Sentry.captureException(entry.error, scope => {
			scope.setTag('project', entry.loggerAttributes.project ?? entry.ownAttributes.project)
			scope.setTag('projectGroup', entry.loggerAttributes.projectGroup ?? entry.ownAttributes.projectGroup)
			scope.setTag('module', entry.loggerAttributes.module ?? entry.ownAttributes.module)
			scope.setLevel(logLevelMapping[entry.level.name])
			scope.setUser({
				id: entry.loggerAttributes.user ?? entry.ownAttributes.user,
			})
			scope.setExtra('requestId', entry.loggerAttributes.requestId)

			scope.addEventProcessor(event => {
				const traceId = entry.loggerAttributes.traceId
				const spanId = entry.loggerAttributes.spanId
				return {
					...event,
					request: {
						url: entry.loggerAttributes.url ?? entry.ownAttributes.url,
						data: entry.loggerAttributes[LoggerRequestBody],
					},
					...(typeof traceId === 'string' && typeof spanId === 'string'
						? { contexts: { ...event.contexts, trace: { trace_id: traceId, span_id: spanId } } }
						: {}),
				}
			})
			return scope
		})
	}

	close(): void {
	}
}

type SentryIntegration = ReturnType<typeof Sentry.getDefaultIntegrations>[number]

// Undici (fetch) would record outgoing request URLs, which may carry a webhook credential in the path or query,
// in breadcrumbs and spans, and add Sentry trace headers to every webhook request.
export const filterSentryIntegrations = (integrations: SentryIntegration[]): SentryIntegration[] =>
	integrations.filter(integration => !['Console', 'Http', 'Undici'].includes(integration.name))

export const createSentryLoggerHandler = (dsn?: string): null | LoggerHandler => {
	if (!dsn) {
		return null
	}
	Sentry.init({
		dsn: dsn,
		integrations: filterSentryIntegrations,
	})
	return new SentryLoggerHandler(LogLevels.warn)
}
