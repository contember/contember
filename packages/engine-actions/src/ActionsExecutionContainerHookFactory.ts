import { TriggerHandler, TriggerIndirectChangesFetcher, TriggerPayloadManager } from './triggers'
import { ListenerStoreProvider } from './ListenerStoreProvider'
import { TriggerPayloadBuilder } from './triggers/TriggerPayloadBuilder'
import { TriggerPayloadPersister } from './triggers/TriggerPayloadPersister'
import { ExecutionContainerHook, InMemoryTriggeredActionsCollector, Mapper, TriggeredActionsCollector } from '@contember/engine-content-api'

// Each transaction attempt has its own mapper. Its action IDs reach the request collector only once the attempt
// commits, so a rolled-back or retried attempt reports no event that was never stored.
const collectAfterCommit = (mapper: Mapper, requestCollector: TriggeredActionsCollector): TriggeredActionsCollector => {
	const attemptCollector = new InMemoryTriggeredActionsCollector()
	mapper.eventManager.listen('AfterCommitEvent', async () => {
		requestCollector.add(attemptCollector.getEvents())
	})
	return attemptCollector
}

export class ActionsExecutionContainerHookFactory {
	constructor(
		private readonly listenerStoreProvider: ListenerStoreProvider,
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
					mapperFactory.hooks.push(mapper => {
						const attemptCollector = triggeredActionsCollector ? collectAfterCommit(mapper, triggeredActionsCollector) : undefined
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
