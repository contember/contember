import type { ReactElement } from 'react'
import * as ReactDOM from 'react-dom'
import type { ProjectConfig } from '../state/projectsConfigs'
import { assertValidClientConfig } from './assertValidClientConfig'
import type { ClientConfig } from './ClientConfig'
import StackTracey from 'stacktracey'
import { Buffer } from 'buffer'
import { DevErrorManager, ErrorBus } from '../components/Dev'
import { ProjectEntrypoint } from '../components'

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
		options.reactRoot || ((config, projectConfigs) => <ProjectEntrypoint basePath="" clientConfig={config} projectConfig={projectConfigs[0]} />)

	const projectConfigs = Object.values(projects)
		.map(it => (Array.isArray(it) ? it : [it]))
		.reduce((acc, it) => [...acc, ...it], [])

	const getErrorContainer = () => {
		const errorElementId = '__contember__dev__error__container__element'
		let errorContainer = document.getElementById(errorElementId)

		if (errorContainer) {
			ReactDOM.unmountComponentAtNode(errorContainer)
		} else {
			errorContainer = document.createElement('div')
			errorContainer.id = errorElementId
			document.body.appendChild(errorContainer)
		}
		return errorContainer
	}
	const reactElement = reactRoot(config, projectConfigs)
	if (import.meta.env.DEV) {
		const errorBus = new ErrorBus()
		window.Buffer = Buffer
		window.addEventListener('error', e => {
			if (e.message.startsWith('ResizeObserver')) {
				// Apparently, this can be ignored: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
				return
			}
			errorBus.handleError('Unhandled error', e.error)
		})
		window.addEventListener('unhandledrejection', e => errorBus.handleError('Unhandled promise rejection', e.reason))
		const origOnError = console.error
		console.error = (...args) => {
			origOnError(...args)
			for (const arg of args) {
				if (!(arg instanceof Error)) {
					continue
				}
				errorBus.handleError('Logged error', arg)
			}
		}
		ReactDOM.render(<DevErrorManager bus={errorBus} />, getErrorContainer())
		try {
			ReactDOM.render(reactElement, rootEl)
		} catch (error) {
			errorBus.handleError('React crash', error)
		}
	} else {
		const renderError = () => {
			ReactDOM.render(<h1>Fatal error</h1>, getErrorContainer())
		}

		window.addEventListener('error', renderError)
		window.addEventListener('unhandledrejection', renderError)
		try {
			ReactDOM.render(reactElement, rootEl)
		} catch (e) {
			console.error(e)
			renderError()
		}
	}
}
