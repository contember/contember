import * as ReactDOM from 'react-dom'
import { DevErrorManager, ErrorBus } from '../components/Dev'
import { Buffer } from 'buffer'

const getErrorContainer = () => {
	const errorElementId = '__contember__dev__error__container__element'
	let errorContainer = document.getElementById(errorElementId)

	if (errorContainer) {
		ReactDOM.unmountComponentAtNode(errorContainer)
	} else {
		errorContainer = document.createElement('div')
		errorContainer.id = errorElementId
		document.body.appendChild(errorContainer)
	}
	return errorContainer
}

const devErrorHandler = (): TryRun => {
	const errorBus = new ErrorBus()
	window.Buffer = Buffer
	window.addEventListener('error', e => {
		if (e.message.startsWith('ResizeObserver')) {
			// Apparently, this can be ignored: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
			return
		}
		errorBus.handleError('Unhandled error', e.error)
	})
	window.addEventListener('unhandledrejection', e => errorBus.handleError('Unhandled promise rejection', e.reason))
	const origOnError = console.error
	console.error = (...args) => {
		origOnError(...args)
		for (const arg of args) {
			if (!(arg instanceof Error)) {
				continue
			}
			errorBus.handleError('Logged error', arg)
		}
	}
	ReactDOM.render(<DevErrorManager bus={errorBus}/>, getErrorContainer())

	return async cb => {
		try {
			await cb()
		} catch (e) {
			errorBus.handleError('Entrypoint crash', e)
		}
	}
}

type TryRun = <T>(cb: () => T | Promise<T>) => void
const prodErrorHandler = (): TryRun => {
	const renderError = () => {
		ReactDOM.render(<h1>Fatal error</h1>, getErrorContainer())
	}

	window.addEventListener('error', renderError)
	window.addEventListener('unhandledrejection', renderError)

	return async cb => {
		try {
			await cb()
		} catch (e) {
			console.error(e)
			renderError()
		}
	}
}


export const createErrorHandler = () => {
	if (import.meta.env.DEV) {
		return devErrorHandler()
	} else {
		return prodErrorHandler()
	}
}
