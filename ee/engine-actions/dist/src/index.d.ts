import { Plugin } from '@contember/engine-plugins'
import { MigrationGroup } from '@contember/database-migrations'
import { MasterContainerHook } from '@contember/engine-http'
export { TriggerListenersFactory, TriggerListenersStore, TriggerHandler, TriggerPayloadManager, TriggerIndirectChangesFetcher } from './triggers'
export { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory'
export { ListenerStoreProvider } from './ListenerStoreProvider'
export default class ActionsPlugin implements Plugin {
	name: string
	getSystemMigrations(): MigrationGroup
	getExecutionContainerHook(): import('@contember/engine-content-api').ExecutionContainerHook
	getMasterContainerHook(): MasterContainerHook
}
//# sourceMappingURL=index.d.ts.map
