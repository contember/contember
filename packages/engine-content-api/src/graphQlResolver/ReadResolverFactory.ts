import { Context } from '../types'
import { ExecutionContainerFactory } from './ExecutionContainerFactory'
import ReadResolver from './ReadResolver'

class ReadResolverFactory {
	constructor(private readonly executionContainerFactory: ExecutionContainerFactory) {}

	public create(context: Context): ReadResolver {
		return this.executionContainerFactory.create(context).get('readResolver')
	}
}

export default ReadResolverFactory
