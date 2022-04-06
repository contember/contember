import { MasterContainerArgs, MasterContainerFactory } from './MasterContainer'
import { MasterContainerFactory as BaseMasterContainerFactory } from '@contember/engine-server'

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory(new BaseMasterContainerFactory()).create(args)
}
