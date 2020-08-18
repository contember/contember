import { EntityListAccessor } from '../accessors'

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
	onBeforeUpdate?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onInitialize?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onUpdate?: EntityListAccessor.UpdateListener | Set<EntityListAccessor.UpdateListener>
}
