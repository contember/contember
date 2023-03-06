import * as Sentry from '@sentry/node'
import { LogEntry, LoggerHandler, LogLevel, LogLevels } from '@contember/logger'
import { LoggerRequestBody } from '../application'

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
			scope.setTag('module', entry.loggerAttributes.module ?? entry.ownAttributes.module)
			scope.setLevel('error')
			scope.setUser({
				id: entry.loggerAttributes.user ?? entry.ownAttributes.user,
			})
			scope.setExtra('requestId', entry.loggerAttributes.requestId)

			scope.addEventProcessor(event => {
				return {
					...event,
					request: {
						url: entry.loggerAttributes.url ?? entry.ownAttributes.url,
						data: entry.loggerAttributes[LoggerRequestBody],
					},
				}
			})
			return scope
		})
	}

	close(): void {
	}
}

export const createSentryLoggerHandler = (dsn?: string): null | LoggerHandler => {
	if (!dsn) {
		return null
	}
	Sentry.init({
		dsn: dsn,
		integrations: integrations => {
			return integrations.filter(integration => integration.name !== 'Console' && integration.name !== 'Http')
		},
	})
	return new SentryLoggerHandler(LogLevels.warn)
}
