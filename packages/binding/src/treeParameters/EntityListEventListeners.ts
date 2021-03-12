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

export type UnsugarableEntityListEventListeners = {
	[EventName in keyof EntityListAccessor.EntityListEventListenerMap & string as `on${Capitalize<EventName>}`]?:
		| EntityListAccessor.EntityListEventListenerMap[EventName]
		| Set<EntityListAccessor.EntityListEventListenerMap[EventName]>
}
