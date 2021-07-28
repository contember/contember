import { MasterContainerFactory, MasterContainerArgs } from './MasterContainer'
import { ProjectConfig } from '@contember/engine-http'
import { readConfig } from './config/config'
import { ProcessType } from './utils'

export { MasterContainerFactory, ProjectConfig, readConfig, ProcessType }

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory().create(args)
}
