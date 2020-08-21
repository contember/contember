import { EntityAccessor } from '../accessors'
import { FieldName } from './primitives'

export interface DesugaredSingleEntityEventListeners {}

export interface SingleEntityEventListeners {
	eventListeners: {
		[Type in Exclude<EntityAccessor.EntityEventType, 'connectionUpdate'>]:
			| Set<EntityAccessor.EntityEventListenerMap[Type]>
			| undefined
	} & {
		connectionUpdate: Map<FieldName, Set<EntityAccessor.UpdateListener>> | undefined
	}
}

export interface SugarableSingleEntityEventListeners {}

export interface UnsugarableSingleEntityEventListeners {
	onBeforePersist?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onConnectionUpdate?: {
		[fieldName: string]: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
	}
	onInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
}
