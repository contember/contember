import { TriggerHandler, TriggerIndirectChangesFetcher, TriggerPayloadManager } from './triggers/index.js'
import { ListenerStoreProvider } from './ListenerStoreProvider.js'
import { TriggerPayloadBuilder } from './triggers/TriggerPayloadBuilder.js'
import { TriggerPayloadPersister } from './triggers/TriggerPayloadPersister.js'
import { ExecutionContainerHook } from '@contember/engine-content-api'
import { ActionsMetrics } from './ActionsMetrics.js'
import { createAttemptScopedTriggeredActionsCollector } from './triggers/AttemptScopedTriggeredActionsCollector.js'

export class ActionsExecutionContainerHookFactory {
	constructor(
		private readonly listenerStoreProvider: ListenerStoreProvider,
		// Resolved lazily: the metrics singleton lives in the master container and is wired up when the
		// dispatch worker boots, which precedes any content request that could enqueue an event.
		private readonly metricsProvider: () => ActionsMetrics | undefined,
	) {
	}

	create(): ExecutionContainerHook {
		return builder => {
			return builder.setupService(
				'mapperFactory',
				(
					mapperFactory,
					{ whereBuilder, schema, pathFactory, systemSchema, providers, stage, project, schemaMeta, joinBuilder, userInfo, triggeredActionsCollector },
				) => {
					const projectMetrics = this.metricsProvider()?.forProject(project.slug)
					mapperFactory.hooks.push(mapper => {
						const attemptCollector = createAttemptScopedTriggeredActionsCollector(
							triggeredActionsCollector,
							publish => mapper.eventManager.listen('AfterCommitEvent', async () => publish()),
						)
						const triggerPayloadPersister = new TriggerPayloadPersister(
							mapper,
							mapper.db.forSchema(systemSchema),
							providers,
							project.slug,
							stage.id,
							schemaMeta.id,
							mapper.identityId,
							userInfo,
							attemptCollector,
							projectMetrics,
						)
						const triggerPayloadBuilder = new TriggerPayloadBuilder(mapper)
						const payloadManager = new TriggerPayloadManager(triggerPayloadBuilder, triggerPayloadPersister)
						const changesFetcher = new TriggerIndirectChangesFetcher(schema.model, mapper, whereBuilder, joinBuilder, pathFactory)
						const listenersStore = this.listenerStoreProvider.getListenerStore(schema)
						const triggerHandler = new TriggerHandler(payloadManager, listenersStore, changesFetcher)
						triggerHandler.attach(mapper.eventManager)
					})
				},
			)
		}
	}
}
