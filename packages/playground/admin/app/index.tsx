import '../index.css'
import { createErrorHandler } from '@contember/react-devbar'
import { createRoot } from 'react-dom/client'
import { Application } from './application'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

errorHandler(onRecoverableError => createRoot(rootEl, { onRecoverableError }).render(<Application />))
