import CompositionRoot from './CompositionRoot'
import Project from './config/Project'
import { Config, readConfig } from './config/config'
import { Server } from 'http'
import { initSentry } from './utils'
import { Plugin } from '@contember/engine-plugins'
import * as http from './http'

export { CompositionRoot, Project, readConfig }

export { http }

export async function run(
	debug: boolean,
	config: Config,
	projectsDirectory: string,
	plugins: Plugin[],
): Promise<Server> {
	const container = new CompositionRoot().createMasterContainer(debug, config, projectsDirectory, plugins)
	await container.initializer.initialize()
	initSentry(config.server.logging.sentry?.dsn)

	return await container.serverRunner.run()
}
