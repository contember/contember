import { ReactElement } from 'react'
import { createErrorHandler } from './errorHandling'
import * as ReactDOM from 'react-dom'

export const runReactApp = (
	reactElement: ReactElement,
	domRoot?: HTMLElement | string | null,
) => {
	const rootEl = domRoot instanceof HTMLElement
		? domRoot
		: document.querySelector<HTMLElement>(domRoot ?? '#root')

	if (!rootEl) {
		throw new Error('Contember root element not found')
	}

	const handler = createErrorHandler()
	handler(() => ReactDOM.render(reactElement, rootEl))
}
