import { ReactElement } from 'react'
import { createErrorHandler } from './errorHandling'
import * as ReactDOM from 'react-dom'

export const runReactApp = (
	reactElement: ReactElement,
	domRoot?: HTMLElement | string | null,
) => {
	const rootEl = (() => {
		if (domRoot && domRoot instanceof HTMLElement) {
			return domRoot
		}
		const selector = domRoot || '#root'
		return document.querySelector<HTMLElement>(selector)
	})()
	if (!rootEl) {
		throw new Error('Contember root element not found')
	}


	const handler = createErrorHandler()
	handler(() => ReactDOM.render(reactElement, rootEl))
}
