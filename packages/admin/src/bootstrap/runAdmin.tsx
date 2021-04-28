import { DevError } from '@contember/ui'
import { ReactElement } from 'react'
import * as ReactDOM from 'react-dom'
import { Admin } from '../components'
import { ProjectConfig } from '../state/projectsConfigs'
import { assertValidClientConfig } from './assertValidClientConfig'
import { ClientConfig } from './ClientConfig'

type ReactRootFactory = (config: ClientConfig, projects: ProjectConfig[]) => ReactElement

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

	const handleError = (error: Error | PromiseRejectionEvent | ErrorEvent) => {
		const errorElementId = '__contember__dev__error__container__element'
		let errorContainer = document.getElementById(errorElementId)

		if (errorContainer) {
			return
		}

		errorContainer = document.createElement('div')
		errorContainer.id = errorElementId

		document.body.appendChild(errorContainer)

		if (__DEV_MODE__) {
			ReactDOM.render(<DevError error={error} />, errorContainer)
		} else {
			ReactDOM.render(<h1>Fatal error</h1>, errorContainer)
		}
	}

	window.addEventListener('error', handleError)
	window.addEventListener('unhandledrejection', handleError)
	try {
		ReactDOM.render(reactRoot(config, projectConfigs), rootEl)
	} catch (e) {
		handleError(e)
	}
}
