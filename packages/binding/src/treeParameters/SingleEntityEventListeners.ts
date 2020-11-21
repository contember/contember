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
	onBeforePersist?:
		| EntityAccessor.EntityEventListenerMap['beforePersist']
		| Set<EntityAccessor.EntityEventListenerMap['beforePersist']>
	onBeforeUpdate?:
		| EntityAccessor.EntityEventListenerMap['beforePersist']
		| Set<EntityAccessor.EntityEventListenerMap['beforePersist']>
	onConnectionUpdate?: {
		[fieldName: string]:
			| EntityAccessor.EntityEventListenerMap['connectionUpdate']
			| Set<EntityAccessor.EntityEventListenerMap['connectionUpdate']>
	}
	onInitialize?:
		| EntityAccessor.EntityEventListenerMap['initialize']
		| Set<EntityAccessor.EntityEventListenerMap['initialize']>
	onPersistError?:
		| EntityAccessor.EntityEventListenerMap['persistError']
		| Set<EntityAccessor.EntityEventListenerMap['persistError']>
	onPersistSuccess?:
		| EntityAccessor.EntityEventListenerMap['persistSuccess']
		| Set<EntityAccessor.EntityEventListenerMap['persistSuccess']>
	onUpdate?: EntityAccessor.EntityEventListenerMap['update'] | Set<EntityAccessor.EntityEventListenerMap['update']>
}
