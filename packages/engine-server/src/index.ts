import CompositionRoot from './CompositionRoot'
import { ProjectConfig, ProjectConfigResolver } from '@contember/engine-http'
import { Config, readConfig } from './config/config'
import { Plugin } from '@contember/engine-plugins'
import { ProcessType } from './utils'

export { CompositionRoot, ProjectConfig, readConfig }

export const createContainer = (
	debug: boolean,
	config: Config,
	projectConfigResolver: ProjectConfigResolver,
	plugins: Plugin[],
	processType: ProcessType = ProcessType.singleNode,
) => {
	return new CompositionRoot().createMasterContainer(debug, config, projectConfigResolver, plugins, processType)
}
