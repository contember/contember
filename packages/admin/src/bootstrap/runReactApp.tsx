import { ReactElement } from 'react'
import { createErrorHandler } from './errorHandling'
import * as ReactDOM from 'react-dom'

export const runReactApp = (
	reactElement: ReactElement,
	domRoot?: HTMLElement | string | null,
) => {
	const rootEl = domRoot instanceof HTMLElement
		? domRoot
		: typeof domRoot === 'string'
		? document.querySelector<HTMLElement>(domRoot)
		: document.body.appendChild(document.createElement('div'))

	const handler = createErrorHandler()
	handler(() => ReactDOM.render(reactElement, rootEl))
}
