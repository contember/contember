import { EntityAccessor, EntityListAccessor } from '../accessors'

export interface DesugaredEntityListEventListeners {}

export interface EntityListEventListeners {
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
}

export interface SugarableEntityListEventListeners {}

export interface UnsugarableEntityListEventListeners {
	onBeforePersist?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onBeforeUpdate?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onChildInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	unstable_onInitialize?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onUpdate?: EntityListAccessor.UpdateListener | Set<EntityListAccessor.UpdateListener>
}
