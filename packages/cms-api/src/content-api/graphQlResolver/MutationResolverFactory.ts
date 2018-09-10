import { Context } from '../types'
import ExecutionContainerFactory from './ExecutionContainerFactory'
import MutationResolver from './MutationResolver'

class MutationResolverFactory {
	constructor(private readonly executionContainerFactory: ExecutionContainerFactory) {}

	public create(context: Context): MutationResolver {
		return this.executionContainerFactory.create(context).get('mutationResolver')
	}
}

export default MutationResolverFactory
