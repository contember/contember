import type { EntityAccessor } from '../accessors'
import type { EventListenersStore } from './EventListenersStore'

type Events = EntityAccessor.EntityEventListenerMap

export type EntityEventListenerStore = EventListenersStore<keyof Events, Events>

export interface SingleEntityEventListeners {
	eventListeners: EntityEventListenerStore | undefined
}


