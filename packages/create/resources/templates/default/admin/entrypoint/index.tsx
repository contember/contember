import { createErrorHandler } from '@contember/react-devbar'
import { LoginEntrypoint } from './login-entrypoint'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../sentry'
import { loginEntrypointConfig } from './config'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

errorHandler(onRecoverableError => createRoot(rootEl, { onRecoverableError }).render(<LoginEntrypoint {...loginEntrypointConfig} />))
