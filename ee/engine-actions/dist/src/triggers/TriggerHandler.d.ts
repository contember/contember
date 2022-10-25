import { AfterInsertEvent, AfterUpdateEvent, BeforeDeleteEvent, BeforeJunctionUpdateEvent, BeforeUpdateEvent, EventManager } from '@contember/engine-content-api'
import { TriggerListenersStore } from './TriggerListenersStore'
import { TriggerPayloadManager } from './TriggerPayloadManager'
import { TriggerIndirectChangesFetcher } from './TriggerIndirectChangesFetcher'
export declare type EventCause = BeforeUpdateEvent | AfterUpdateEvent | BeforeDeleteEvent | AfterInsertEvent | BeforeJunctionUpdateEvent
export declare class TriggerHandler {
	private readonly payloadManager
	private readonly listenersStore
	private readonly changesFetcher
	constructor(payloadManager: TriggerPayloadManager, listenersStore: TriggerListenersStore, changesFetcher: TriggerIndirectChangesFetcher)
	attach(evm: EventManager): void
	private directDeleteHandler
	private directUpdateHandler
	private directCreateHandler
	/**
     * Collect affected triggers after entity was created or before it was deleted.
     * todo: after insert, it should probably check only owning relations, because other relations are connected later, so it would be always empty
     */
	private indirectChangesEntityHandler
	private indirectChangesRelationHandler
	private indirectChangesUpdatesHandler
	private indirectChangesUpdatesHandlerInner
	private junctionHandler
	private collectDeepChanges
}
//# sourceMappingURL=TriggerHandler.d.ts.map
