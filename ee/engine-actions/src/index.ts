import { Plugin } from '@contember/engine-plugins'
import { migrationsGroup } from './migrations'
import { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory'
import { ListenerStoreProvider } from './ListenerStoreProvider'
import { MigrationGroup } from '@contember/database-migrations'
import { MasterContainerBuilder, MasterContainerHook } from '@contember/engine-http'
import { ActionsApiMiddlewareFactory } from './graphql/http/ActionsApiMiddlewareFactory'
import { ActionsGraphQLHandlerFactory } from './graphql/http/ActionsGraphQLHandlerFactory'
import { ResolversFactory } from './graphql/resolvers/ResolversFactory'
import { EventsQueryResolver, ProcessBatchMutationResolver, SetVariablesMutationResolver } from './graphql/resolvers'
import { EventDispatcher } from './dispatch/EventDispatcher'
import { EventsRepository } from './dispatch/EventsRepository'
import { TargetHandlerResolver } from './dispatch/TargetHandlerResolver'
import { WebhookTargetHandler } from './dispatch/WebhookTargetHandler'
import { ActionsContextResolver } from './graphql/http/ActionsContextResolver'
import { ActionsWebsocketControllerFactory } from './graphql/http/ActionsWebsocketControllerFactory'
import { DispatchWorkerSupervisorFactory } from './dispatch/DispatchWorkerSupervisor'
import { ProjectDispatcherFactory } from './dispatch/ProjectDispatcher'
import { VariablesQueryResolver } from './graphql/resolvers/query/VariablesQueryResolver'
import { VariablesManager } from './model/VariablesManager'
import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { ActionsPermissionsFactory } from './authorization'
import { WebhookFetcherNative } from './dispatch/WebhookFetcher'

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
				.addService('actions_variableManager', () => {
					return new VariablesManager()
				})
				.addService('actions_eventDispatcher', ({ actions_variableManager }) => {
					const eventsRepository = new EventsRepository()
					const webhookTargetHandler = new WebhookTargetHandler(new WebhookFetcherNative())
					const targetHandlerResolver = new TargetHandlerResolver(webhookTargetHandler)
					return new EventDispatcher(eventsRepository, actions_variableManager, targetHandlerResolver)
				})
				.addService('actions_dispatchWorkerSupervisorFactory', ({ actions_eventDispatcher }) => {
					const projectDispatcherFactory = new ProjectDispatcherFactory(actions_eventDispatcher)
					return new DispatchWorkerSupervisorFactory(projectDispatcherFactory)
				})
				.addService('actions_authorizator', () => {
					return new Authorizator.Default(new AccessEvaluator.PermissionEvaluator(new ActionsPermissionsFactory().create()))
				})
				.setupService('application', (it, { projectContextResolver, debugMode, actions_eventDispatcher, actions_dispatchWorkerSupervisorFactory, actions_variableManager, actions_authorizator }) => {
					const handlerFactory = new ActionsGraphQLHandlerFactory()
					const eventsQueryResolver = new EventsQueryResolver()
					const processBatchMutationResolver = new ProcessBatchMutationResolver(actions_eventDispatcher)
					const variablesQueryResolver = new VariablesQueryResolver(actions_variableManager)
					const setVariablesMutationResolver = new SetVariablesMutationResolver(actions_variableManager)
					const resolversFactory = new ResolversFactory(
						eventsQueryResolver,
						processBatchMutationResolver,
						variablesQueryResolver,
						setVariablesMutationResolver,
					)

					const actionsContextResolver = new ActionsContextResolver(debugMode, projectContextResolver)
					const actionsMiddlewareFactory = new ActionsApiMiddlewareFactory(actionsContextResolver, handlerFactory.create(resolversFactory), actions_authorizator)
					const actionsWebsocketMiddlewareFactory = new ActionsWebsocketControllerFactory(debugMode, actionsContextResolver, actions_dispatchWorkerSupervisorFactory)
					it.addRoute('actions', '/actions/:projectSlug', actionsMiddlewareFactory.create())
					it.addWebsocketRoute('actions', '/actions/_worker', actionsWebsocketMiddlewareFactory.create())
				})
				.setupService('applicationWorkers', (it, { actions_dispatchWorkerSupervisorFactory, projectGroupContainer, serverConfig }) => {
					if (!(serverConfig as any).projectGroup) {
						it.registerWorker(this.name, actions_dispatchWorkerSupervisorFactory.create(projectGroupContainer))
					}
				}) as unknown as MasterContainerBuilder

		}
		return hook
	}
}
