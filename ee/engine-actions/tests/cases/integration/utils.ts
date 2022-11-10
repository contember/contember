import { ActionsExecutionContainerHookFactory, ListenerStoreProvider } from '../../../src'
import { ExecutionContainerFactory } from '@contember/engine-content-api'
import { Providers } from '@contember/schema-utils'

export const executionContainerFactoryFactory = (providers: Providers) => {
	const factory = new ExecutionContainerFactory(providers)
	factory.hooks.push(new ActionsExecutionContainerHookFactory(new ListenerStoreProvider()).create())
	return factory
}
