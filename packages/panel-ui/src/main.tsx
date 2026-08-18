import { createRoot } from 'react-dom/client'
import { App } from './App.js'
import { getPanelConfig } from './config.js'
import './index.css'

const rootEl = document.body.appendChild(document.createElement('div'))

createRoot(rootEl).render(<App config={getPanelConfig()} />)
