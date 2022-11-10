import { TriggerHandler, TriggerIndirectChangesFetcher, TriggerPayloadManager } from './triggers'
import { ListenerStoreProvider } from './ListenerStoreProvider'
import { TriggerPayloadBuilder } from './triggers/TriggerPayloadBuilder'
import { TriggerPayloadPersister } from './triggers/TriggerPayloadPersister'
import { ExecutionContainerHook } from '@contember/engine-content-api'

export class ActionsExecutionContainerHookFactory {
	constructor(
		private readonly listenerStoreProvider: ListenerStoreProvider,
	) {
	}

	create(): ExecutionContainerHook {
		return builder => {
			return builder.setupService('mapperFactory', (mapperFactory, { whereBuilder, schema, pathFactory, systemSchema, providers, stage, project }) => {
				mapperFactory.hooks.push(mapper => {
					const triggerPayloadPersister = new TriggerPayloadPersister(mapper, mapper.db.forSchema(systemSchema), providers, project.slug, stage.id, schema.id)
					const triggerPayloadBuilder = new TriggerPayloadBuilder(mapper)
					const payloadManager = new TriggerPayloadManager(triggerPayloadBuilder, triggerPayloadPersister)
					const changesFetcher = new TriggerIndirectChangesFetcher(mapper, whereBuilder, pathFactory)
					const listenersStore = this.listenerStoreProvider.getListenerStore(schema)
					const triggerHandler = new TriggerHandler(payloadManager, listenersStore, changesFetcher)
					triggerHandler.attach(mapper.eventManager)
				})
			})
		}
	}
}
