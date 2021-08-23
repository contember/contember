import type { ReactElement } from 'react'
import type { ProjectConfig } from '../state/projectsConfigs'
import { assertValidClientConfig } from './assertValidClientConfig'
import type { ClientConfig } from './ClientConfig'
import { ProjectEntrypoint } from '../components'
import { runReactApp } from './runReactApp'

type ReactRootFactory = (config: ClientConfig, projects: ProjectConfig[]) => ReactElement

type ConfigOptions = {
	configElement?: HTMLElement | string
} | {
	config: ClientConfig
	configElement?: never
};

const resolveConfig = (options: ConfigOptions) => {
	let clientConfig: ClientConfig
	if ('config' in options) {
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
}

interface ReactRootOptions {
	root?: HTMLElement | string
	reactRoot?: ReactRootFactory
}

/**
 * @deprecated
 */
export const runAdmin = (
	projects: Record<string, ProjectConfig[] | ProjectConfig>,
	options: ReactRootOptions & ConfigOptions = {},
) => {
	const config = resolveConfig(options)

	const projectConfigs = Object.values(projects)
		.map(it => (Array.isArray(it) ? it : [it]))
		.reduce((acc, it) => [...acc, ...it], [])
	if (projectConfigs.length > 1) {
		console.error('Multi-project entrypoint is deprecated')
	}

	const reactElement = options.reactRoot?.(config, projectConfigs) ?? <ProjectEntrypoint basePath="" clientConfig={config}
																					projectConfig={projectConfigs[0]}/>

	return runReactApp(reactElement, options.root)
}

