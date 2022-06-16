import * as Sentry from '@sentry/node'

export const initSentry = (dsn?: string) => {
	if (!dsn) {
		return
	}
	// eslint-disable-next-line no-console
	console.log(`Intializing sentry with dsn: ${dsn}`)
	Sentry.init({
		dsn: dsn,
		integrations: integrations => {
			return integrations.filter(integration => integration.name !== 'Console' && integration.name !== 'Http')
		},
	})
}

interface SentryErrorContext {
	user: string
	body: string
	project?: string
	url: string
	module: string
}

export const logSentryError = (error: any, context: SentryErrorContext) => {
	Sentry.withScope(scope => {
		if (context.project) {
			scope.setTag('project', context.project)
		}
		scope.setTag('module', context.module)
		scope.setLevel('error')
		scope.setUser({
			id: context.user,
		})
		scope.addEventProcessor(event => {
			return {
				...event,
				request: {
					url: context.url,
					data: context.body,
				},
			}
		})
		Sentry.captureException(error)
	})
}
