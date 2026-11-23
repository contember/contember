import { GraphQlClientError } from '@contember/graphql-client'
import * as Sentry from '@sentry/react'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
const enableSentry = sentryDsn && import.meta.env.MODE === 'production'
const projectName = import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME

Sentry.init({
	enabled: enableSentry,
	dsn: sentryDsn,
	integrations: [
		Sentry.browserApiErrorsIntegration(),
		Sentry.browserSessionIntegration(),
		Sentry.browserTracingIntegration(),
		Sentry.captureConsoleIntegration({ levels: ['error'] }),
		Sentry.replayIntegration(),
	],
	initialScope: {
		tags: {
			environment: import.meta.env.MODE,
			projectName: projectName,
		},
	},
	tracesSampleRate: 1,
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 1,
	// A request the browser cancelled (navigation, unload) is not a failure; the console breadcrumb still records it.
	beforeSend: (event, hint) => {
		const error = hint.originalException
		return error instanceof GraphQlClientError && error.type === 'aborted' ? null : event
	},
})
