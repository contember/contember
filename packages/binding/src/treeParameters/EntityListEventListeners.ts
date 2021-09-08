import type { EntityListAccessor } from '../accessors'
import type { EntityEventListenerStore } from './SingleEntityEventListeners'
import type { EventListenersStore } from './EventListenersStore'

type Events = EntityListAccessor.EntityListEventListenerMap
type UnsugarableEvents = EntityListAccessor.EntityListEventListenerMap & EntityListAccessor.ChildEventListenerMap


export type EntityListEventListenerStore = EventListenersStore<keyof Events, Partial<Events>>

export interface EntityListEventListeners {
	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

export type UnsugarableEntityListEventListeners = {
	[EventType in keyof UnsugarableEvents & string as `on${Capitalize<EventType>}`]?:
		| UnsugarableEvents[EventType]
		| Set<UnsugarableEvents[EventType]>
}
