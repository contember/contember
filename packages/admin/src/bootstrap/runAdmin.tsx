import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Admin } from '../components'
import { ProjectConfig } from '../state/projectsConfigs'
import { assertValidClientConfig } from './assertValidClientConfig'
import { ClientConfig } from './ClientConfig'

type ReactRootFactory = (config: ClientConfig, projects: ProjectConfig[]) => React.ReactElement

export const runAdmin = (
	projects: Record<string, ProjectConfig[] | ProjectConfig>,
	options: {
		root?: HTMLElement | string
		configElement?: HTMLElement | string
		config?: ClientConfig
		reactRoot?: ReactRootFactory
	} = {},
) => {
	const rootEl = (() => {
		if (options.root && options.root instanceof HTMLElement) {
			return options.root
		}
		const selector = options.root || '#root'
		return document.querySelector<HTMLElement>(selector)
	})()
	if (!rootEl) {
		throw new Error('Contember root element not found')
	}

	const config = (() => {
		let clientConfig: ClientConfig
		if (options.config) {
			clientConfig = options.config
		} else {
			let configEl: HTMLElement | null
			if (options.configElement && options.configElement instanceof HTMLElement) {
				configEl = options.configElement
			} else {
				configEl = document.querySelector<HTMLElement>(options.configElement || '#contember-config')
			}
			if (!configEl) {
				throw new Error('No Contember configuration found')
			}
			clientConfig = JSON.parse(configEl.innerHTML)
		}
		assertValidClientConfig(clientConfig)
		return clientConfig
	})()

	const reactRoot: ReactRootFactory =
		options.reactRoot || ((config, projectConfigs) => <Admin clientConfig={config} configs={projectConfigs} />)

	const projectConfigs = Object.values(projects)
		.map(it => (Array.isArray(it) ? it : [it]))
		.reduce((acc, it) => [...acc, ...it], [])
	ReactDOM.render(reactRoot(config, projectConfigs), rootEl)
}
