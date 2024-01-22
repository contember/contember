import { ReactElement } from 'react'
import { createErrorHandler } from '@contember/react-devbar'
import { createRoot } from 'react-dom/client'

export const runReactApp = (
	reactElement: ReactElement,
	{ domRoot }: {
		domRoot?: HTMLElement,
	} = {},
) => {
	const rootEl = domRoot ?? document.body.appendChild(document.createElement('div'))

	const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

	errorHandler(onRecoverableError => createRoot(rootEl, { onRecoverableError }).render(reactElement))
}
