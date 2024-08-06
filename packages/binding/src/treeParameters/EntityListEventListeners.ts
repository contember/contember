import type { EntityAccessor, EntityListAccessor } from '../accessors'
import type { EntityEventListenerStore } from './SingleEntityEventListeners'
import type { EventListenersStore } from './EventListenersStore'

type Events = EntityListAccessor.EntityListEventListenerMap
type UnsugarableEvents = EntityListAccessor.EntityListEventListenerMap & EntityListAccessor.ChildEventListenerMap


export type EntityListEventListenerStore = EventListenersStore<keyof Events, Partial<Events>>

export interface EntityListEventListeners {
	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

