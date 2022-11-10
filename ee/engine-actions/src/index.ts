import { Plugin } from '@contember/engine-plugins'
import { migrationsGroup } from './migrations'
import { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory'
import { ListenerStoreProvider } from './ListenerStoreProvider'
import { MigrationGroup } from '@contember/database-migrations'
import { MasterContainerBuilder, MasterContainerHook } from '@contember/engine-http'
import { ActionsApiMiddlewareFactory } from './graphql/http/ActionsApiMiddlewareFactory'
import { ActionsGraphQLHandlerFactory } from './graphql/http/ActionsGraphQLHandlerFactory'
import { ResolversFactory } from './graphql/resolvers/ResolversFactory'
import { EventsQueryResolver, ProcessBatchMutationResolver } from './graphql/resolvers'
import { EventDispatcher } from './dispatch/EventDispatcher'
import { EventsRepository } from './dispatch/EventsRepository'
import { TargetHandlerResolver } from './dispatch/TargetHandlerResolver'
import { WebhookTargetHandler } from './dispatch/WebhookTargetHandler'
import { ActionsContextResolver } from './graphql/http/ActionsContextResolver'
import { ActionsWebsocketControllerFactory } from './graphql/http/ActionsWebsocketControllerFactory'
import { DispatchWorkerSupervisorFactory } from './dispatch/DispatchWorkerSupervisor'
import { ProjectDispatcherFactory } from './dispatch/ProjectDispatcher'

export {
	TriggerListenersFactory,
	TriggerListenersStore,
	TriggerHandler,
	TriggerPayloadManager,
	TriggerIndirectChangesFetcher,
} from './triggers'
export { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory'
export { ListenerStoreProvider } from './ListenerStoreProvider'

export default class ActionsPlugin implements Plugin {
	name = 'contember/actions'

	getSystemMigrations(): MigrationGroup {
		return migrationsGroup
	}

	getExecutionContainerHook() {
		const hookFactory = new ActionsExecutionContainerHookFactory(new ListenerStoreProvider())
		return hookFactory.create()
	}

	getMasterContainerHook() {
		const hook: MasterContainerHook = (builder: MasterContainerBuilder) => {
			return builder
				.setupService('application', (it, { projectContextResolver, debugMode }) => {
					const handlerFactory = new ActionsGraphQLHandlerFactory()
					const eventsRepository = new EventsRepository()
					const webhookTargetHandler = new WebhookTargetHandler()
					const targetHandlerResolver = new TargetHandlerResolver(webhookTargetHandler)
					const eventDispatcher = new EventDispatcher(eventsRepository, targetHandlerResolver)
					const eventsQueryResolver = new EventsQueryResolver()
					const processBatchMutationResolver = new ProcessBatchMutationResolver(eventDispatcher)
					const projectDispatcherFactory = new ProjectDispatcherFactory(eventDispatcher)
					const dispatchWorkerSupervisorFactory = new DispatchWorkerSupervisorFactory(projectDispatcherFactory)
					const resolversFactory = new ResolversFactory(eventsQueryResolver, processBatchMutationResolver)

					const actionsContextResolver = new ActionsContextResolver(debugMode, projectContextResolver)
					const actionsMiddlewareFactory = new ActionsApiMiddlewareFactory(actionsContextResolver, handlerFactory.create(resolversFactory))
					const actionsWebsocketMiddlewareFactory = new ActionsWebsocketControllerFactory(debugMode, actionsContextResolver, dispatchWorkerSupervisorFactory)
					it.addRoute('actions', '/actions/:projectSlug', actionsMiddlewareFactory.create())
					it.addWebsocketRoute('actions', '/actions/_worker', actionsWebsocketMiddlewareFactory.create())
				})

		}
		return hook
	}
}
