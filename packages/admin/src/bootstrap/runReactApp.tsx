import { ReactElement } from 'react'
import { legacyReactRenderer, ReactRenderer } from './render'
import { createErrorHandler } from './errorHandling'

export const runReactApp = (
	reactElement: ReactElement,
	domRoot?: HTMLElement | string | null,
	render: ReactRenderer = legacyReactRenderer,
) => {
	const rootEl = domRoot instanceof HTMLElement
		? domRoot
		: typeof domRoot === 'string'
		? document.querySelector<HTMLElement>(domRoot)
		: document.body.appendChild(document.createElement('div'))

	if (!rootEl) {
		throw new Error(`Undefined react root element`)
	}
	const errorHandler = createErrorHandler(render)
	errorHandler(onRecoverableError => render(rootEl, reactElement, onRecoverableError))
}
