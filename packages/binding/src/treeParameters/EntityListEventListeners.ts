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
	onBeforePersist?:
		| EntityListAccessor.EntityListEventListenerMap['beforePersist']
		| Set<EntityListAccessor.EntityListEventListenerMap['beforePersist']>
	onBeforeUpdate?:
		| EntityListAccessor.EntityListEventListenerMap['beforeUpdate']
		| Set<EntityListAccessor.EntityListEventListenerMap['beforeUpdate']>
	onChildInitialize?:
		| EntityListAccessor.EntityListEventListenerMap['childInitialize']
		| Set<EntityListAccessor.EntityListEventListenerMap['childInitialize']>
	onInitialize?:
		| EntityListAccessor.EntityListEventListenerMap['initialize']
		| Set<EntityListAccessor.EntityListEventListenerMap['initialize']>
	onPersistError?:
		| EntityListAccessor.EntityListEventListenerMap['persistError']
		| Set<EntityListAccessor.EntityListEventListenerMap['persistError']>
	onPersistSuccess?:
		| EntityListAccessor.EntityListEventListenerMap['persistSuccess']
		| Set<EntityListAccessor.EntityListEventListenerMap['persistSuccess']>
	onUpdate?:
		| EntityListAccessor.EntityListEventListenerMap['update']
		| Set<EntityListAccessor.EntityListEventListenerMap['update']>
}
