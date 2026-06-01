import { TriggerHandler, TriggerIndirectChangesFetcher, TriggerPayloadManager } from './triggers/index.js'
import { ListenerStoreProvider } from './ListenerStoreProvider.js'
import { TriggerPayloadBuilder } from './triggers/TriggerPayloadBuilder.js'
import { TriggerPayloadPersister } from './triggers/TriggerPayloadPersister.js'
import { ExecutionContainerHook } from '@contember/engine-content-api'

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
						const triggerPayloadPersister = new TriggerPayloadPersister(
							mapper,
							mapper.db.forSchema(systemSchema),
							providers,
							project.slug,
							stage.id,
							schemaMeta.id,
							mapper.identityId,
							userInfo,
							triggeredActionsCollector,
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
