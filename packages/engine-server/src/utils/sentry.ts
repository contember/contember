import * as Sentry from '@sentry/node'
import { LogEntryBag, LoggerTransport } from '@contember/engine-common'
import { LoggerRequestSymbol } from '@contember/engine-http'

export class SentryTransport implements LoggerTransport {
	dispatch(entry: LogEntryBag) {
		if (!entry.base.error) {
			return
		}
		Sentry.captureException(entry.base.error, scope => {
			scope.setTag('project', entry.loggerAttributes.project ?? entry.base.attributes?.project)
			scope.setTag('module', entry.loggerAttributes.module ?? entry.base.attributes?.module)
			scope.setLevel('error')
			scope.setUser({
				id: entry.loggerAttributes.user ?? entry.base.attributes?.user,
			})
			scope.setExtra('requestId', entry.loggerAttributes.requestId)

			scope.addEventProcessor(event => {
				return {
					...event,
					request: {
						url: entry.loggerAttributes.url ?? entry.base.attributes?.url,
						data: entry.loggerAttributes[LoggerRequestSymbol]?.body,
					},
				}
			})
			return scope
		})
	}
}

export const createSentryTransport = (dsn?: string): null | LoggerTransport => {
	if (!dsn) {
		return null
	}
	Sentry.init({
		dsn: dsn,
		integrations: integrations => {
			return integrations.filter(integration => integration.name !== 'Console' && integration.name !== 'Http')
		},
	})
	return new SentryTransport()
}
