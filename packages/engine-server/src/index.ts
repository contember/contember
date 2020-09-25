import CompositionRoot from './CompositionRoot'
import Project from './config/Project'
import { Config, readConfig } from './config/config'
import { Server } from 'http'
import { initSentry } from './utils'
import { Plugin } from '@contember/engine-plugins'

export { CompositionRoot, Project, readConfig }

export async function run(
	debug: boolean,
	config: Config,
	projectsDirectory: string,
	plugins: Plugin[],
): Promise<Server[]> {
	initSentry(config.server.logging.sentry?.dsn)
	const container = new CompositionRoot().createMasterContainer(debug, config, projectsDirectory, plugins)
	await container.initializer.initialize()

	return await container.serverRunner.run()
}
