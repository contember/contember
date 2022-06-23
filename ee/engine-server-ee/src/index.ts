import { MasterContainerArgs, MasterContainerFactory } from './MasterContainer.js'
import { MasterContainerFactory as BaseMasterContainerFactory } from '@contember/engine-server'

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory(new BaseMasterContainerFactory()).create(args)
}
