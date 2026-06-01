import { Plugin } from '@contember/engine-plugins'
import { migrationsGroup } from './migrations/index.js'
import { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory.js'
import { ListenerStoreProvider } from './ListenerStoreProvider.js'
import { MigrationGroup } from '@contember/database-migrations'
import { MasterContainerBuilder, MasterContainerHook } from '@contember/engine-http'
import { ActionsApiMiddlewareFactory } from './graphql/http/ActionsApiMiddlewareFactory.js'
import { ActionsGraphQLHandlerFactory } from './graphql/http/ActionsGraphQLHandlerFactory.js'
import { ResolversFactory } from './graphql/resolvers/ResolversFactory.js'
import {
	EventsQueryResolver,
	ProcessBatchMutationResolver,
	RetryEventMutationResolver,
	SetVariablesMutationResolver,
	StopEventMutationResolver,
} from './graphql/resolvers/index.js'
import { EventDispatcher } from './dispatch/EventDispatcher.js'
import { EventsRepository } from './dispatch/EventsRepository.js'
import { TargetHandlerResolver } from './dispatch/TargetHandlerResolver.js'
import { WebhookTargetHandler } from './dispatch/WebhookTargetHandler.js'
import { ActionsContextResolver } from './graphql/http/ActionsContextResolver.js'
import { ActionsWebsocketControllerFactory } from './graphql/http/ActionsWebsocketControllerFactory.js'
import { DispatchWorkerSupervisorFactory } from './dispatch/DispatchWorkerSupervisor.js'
import { LazyDispatchWorker } from './dispatch/LazyDispatchWorker.js'
import { ProjectDispatcherFactory } from './dispatch/ProjectDispatcher.js'
import { VariablesQueryResolver } from './graphql/resolvers/query/VariablesQueryResolver.js'
import { VariablesManager } from './model/VariablesManager.js'
import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { ActionsPermissionsFactory } from './authorization/index.js'
import { WebhookFetcherNative } from './dispatch/WebhookFetcher.js'

export {
	TriggerHandler,
	TriggerIndirectChangesFetcher,
	TriggerListenersFactory,
	TriggerListenersStore,
	TriggerPayloadManager,
} from './triggers/index.js'
export { ActionsExecutionContainerHookFactory } from './ActionsExecutionContainerHookFactory.js'
export { ListenerStoreProvider } from './ListenerStoreProvider.js'

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
				.addService('actions_eventRepository', () => {
					return new EventsRepository()
				})
				.addService('actions_eventDispatcher', ({ actions_eventRepository, actions_variableManager }) => {
					const webhookTargetHandler = new WebhookTargetHandler(new WebhookFetcherNative())
					const targetHandlerResolver = new TargetHandlerResolver(webhookTargetHandler)
					return new EventDispatcher(actions_eventRepository, actions_variableManager, targetHandlerResolver)
				})
				.addService('actions_dispatchWorkerSupervisorFactory', ({ actions_eventDispatcher }) => {
					const projectDispatcherFactory = new ProjectDispatcherFactory(actions_eventDispatcher)
					return new DispatchWorkerSupervisorFactory(projectDispatcherFactory)
				})
				.addService('actions_authorizator', () => {
					return new Authorizator.Default(new AccessEvaluator.PermissionEvaluator(new ActionsPermissionsFactory().create()))
				})
				.setupService(
					'application',
					(
						it,
						{
							projectContextResolver,
							debugMode,
							actions_eventRepository,
							actions_eventDispatcher,
							actions_dispatchWorkerSupervisorFactory,
							actions_variableManager,
							actions_authorizator,
						},
					) => {
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
							new RetryEventMutationResolver(actions_eventRepository),
							new StopEventMutationResolver(actions_eventRepository),
						)

						const actionsContextResolver = new ActionsContextResolver(debugMode, projectContextResolver)
						const actionsMiddlewareFactory = new ActionsApiMiddlewareFactory(
							actionsContextResolver,
							handlerFactory.create(resolversFactory),
							actions_authorizator,
						)
						const actionsWebsocketMiddlewareFactory = new ActionsWebsocketControllerFactory(
							debugMode,
							actionsContextResolver,
							actions_dispatchWorkerSupervisorFactory,
						)
						it.addRoute('actions', '/actions/:projectSlug', actionsMiddlewareFactory.create())
						it.addWebsocketRoute('actions', '/actions/_worker', actionsWebsocketMiddlewareFactory.create())
					},
				)
				.setupService(
					'applicationWorkers',
					(it, { actions_dispatchWorkerSupervisorFactory, projectGroupContainer, projectGroupContainerResolver, serverConfig }) => {
						if (!(serverConfig as any).projectGroup) {
							it.registerWorker(this.name, actions_dispatchWorkerSupervisorFactory.create(projectGroupContainer))
						} else {
							it.registerWorker(this.name, new LazyDispatchWorker(projectGroupContainerResolver, actions_dispatchWorkerSupervisorFactory))
						}
					},
				) as unknown as MasterContainerBuilder
		}
		return hook
	}
}
