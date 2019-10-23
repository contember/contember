import CompositionRoot from './CompositionRoot'
import Project from './config/Project'
import { readConfig } from './config/config'
import { Schema } from '@contember/schema'
import { Server } from 'http'

export { CompositionRoot, Project, readConfig }

export async function run(
	configFile: string,
	projectsDirectory: string,
	projectSchemas?: { [name: string]: Schema },
): Promise<Server> {
	const config = await readConfig(configFile)
	const container = new CompositionRoot().createMasterContainer(config, projectsDirectory, projectSchemas)
	await container.initializer.initialize()
	return await container.serverRunner.run()
}
