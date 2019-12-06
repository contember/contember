import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Admin } from '@contember/admin'
import './index.sass'
import * as projects from './projects'

const projectConfigs = Object.values(projects)
	.map(it => (Array.isArray(it) ? it : [it]))
	.reduce((acc, it) => [...acc, ...it], [])
const reactRoot = (config: any) => <Admin config={config} configs={projectConfigs} />

window.addEventListener('DOMContentLoaded', function() {
	const el = document.getElementById('root')
	if (!el) {
		return
	}
	const configEl = document.getElementById('contember-config')
	if (!configEl) {
		console.error('No configuration found')
		return
	}
	const config = JSON.parse(configEl.innerHTML)
	ReactDOM.render(reactRoot(config), el)
})
