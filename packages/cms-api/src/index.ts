import CompositionRoot from './CompositionRoot'
import Project from './config/Project'
import { readConfig } from './config/config'
import { Schema } from '@contember/schema'
import { Server } from 'http'

export { CompositionRoot, Project, readConfig }

export async function run(
	debug: boolean,
	configFile: string,
	projectsDirectory: string,
	projectSchemas?: { [name: string]: Schema },
): Promise<Server> {
	let config = await readConfig(configFile)
	const container = new CompositionRoot().createMasterContainer(debug, config, projectsDirectory, projectSchemas)
	await container.initializer.initialize()
	return await container.serverRunner.run()
}
