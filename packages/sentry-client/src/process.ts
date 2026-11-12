import { AsyncLocalStorage } from 'node:async_hooks'
import { format } from 'node:util'
import { SentryClient } from './client.js'
import { Scope } from './types.js'

/** How long an uncaught exception may wait for its event to be delivered before the process exits. */
const shutdownTimeoutMs = 2000

const rejectionWarning = 'This error originated either by throwing inside of an async function without a catch block, '
	+ 'or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:'

// straight to stderr: printed through console.error, the error would be reported again by captureConsoleErrors
const printError = (...args: unknown[]) => process.stderr.write(`${format(...args)}\n`)

/**
 * Reports what would otherwise end or escape the process, as @sentry/node 7 did by default:
 * - an uncaught exception is reported as `fatal`, printed, and the process exits with 1 once the event is delivered
 *   (at most 2 s later); later ones are only printed;
 * - an unhandled rejection is reported and printed with a warning, and the process keeps running. Registering the
 *   listener is what turns off Node's default of crashing on it.
 * Returns a function that removes the listeners.
 */
export const installProcessHandlers = (client: SentryClient): () => void => {
	let exiting = false

	const onUncaughtException = (error: unknown) => {
		if (exiting) {
			// the first one already exits once its event is delivered; exiting now could lose that event
			printError(error)
			return
		}
		exiting = true
		try {
			client.captureException(error, { level: 'fatal' }, { mechanism: { type: 'onuncaughtexception', handled: false } })
		} catch (captureError) {
			printError(captureError)
		}
		printError(error)
		void client.close(shutdownTimeoutMs).finally(() => process.exit(1))
	}

	const onUnhandledRejection = (reason: unknown) => {
		client.captureException(reason, { extra: { unhandledPromiseRejection: true } }, { mechanism: { type: 'onunhandledrejection', handled: false } })
		printError(rejectionWarning)
		printError(reason instanceof Error && reason.stack ? reason.stack : reason)
	}

	process.on('uncaughtException', onUncaughtException)
	process.on('unhandledRejection', onUnhandledRejection)
	return () => {
		process.off('uncaughtException', onUncaughtException)
		process.off('unhandledRejection', onUnhandledRejection)
	}
}

/**
 * Also reports every `console.error` call: an Error among the arguments as an exception, anything else as a message.
 * The arguments are still printed. Off unless called; returns a function that restores `console.error`.
 */
export const captureConsoleErrors = (client: SentryClient): () => void => {
	const original = console.error
	// set for the whole report, its asynchronous part (beforeSend, delivery) included
	const reporting = new AsyncLocalStorage<true>()
	const replacement = (...args: unknown[]) => {
		// a console.error made while reporting (the client's own diagnostics, a beforeSend hook) is only printed
		if (reporting.getStore() === undefined) {
			reporting.run(true, () => {
				const error = args.find(arg => arg instanceof Error)
				const scope: Scope = { level: 'error', extra: { arguments: args } }
				if (error !== undefined) {
					client.captureException(error, scope, { mechanism: { type: 'console', handled: true } })
				} else {
					client.captureMessage(format(...args), scope)
				}
			})
		}
		original.apply(console, args)
	}
	console.error = replacement
	return () => {
		if (console.error === replacement) {
			console.error = original
		}
	}
}
