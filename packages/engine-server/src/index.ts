import CompositionRoot from './CompositionRoot'
import Project from './config/Project'
import { Config, readConfig } from './config/config'
import { Plugin } from '@contember/engine-plugins'
import { ProcessType } from './utils'

export { CompositionRoot, Project, readConfig }

export const createContainer = (
	debug: boolean,
	config: Config,
	projectsDirectory: string,
	plugins: Plugin[],
	processType: ProcessType = ProcessType.singleNode,
) => {
	return new CompositionRoot().createMasterContainer(debug, config, projectsDirectory, plugins, processType)
}
