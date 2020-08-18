import { EntityAccessor } from '../accessors'

export interface DesugaredSingleEntityEventListeners {}

export interface SingleEntityEventListeners {
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
}

export interface SugarableSingleEntityEventListeners {}

export interface UnsugarableSingleEntityEventListeners {
	onBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
}
