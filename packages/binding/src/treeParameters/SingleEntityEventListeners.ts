import type { EntityAccessor } from '../accessors'
import type { EventListenersStore } from './EventListenersStore'

type Events = EntityAccessor.EntityEventListenerMap

export interface DesugaredSingleEntityEventListeners {}

export type EntityEventListenerStore = EventListenersStore<keyof Events, Events>

export interface SingleEntityEventListeners {
	eventListeners: EntityEventListenerStore | undefined
}

export interface SugarableSingleEntityEventListeners {}

export type UnsugarableSingleEntityEventListeners = {
	[EventName in Exclude<keyof EntityAccessor.EntityEventListenerMap, 'connectionUpdate'> &
		string as `on${Capitalize<EventName>}`]?:
		| EntityAccessor.EntityEventListenerMap[EventName]
		| Set<EntityAccessor.EntityEventListenerMap[EventName]>
} & {
	onConnectionUpdate?: {
		[fieldName: string]:
			| EntityAccessor.EntityEventListenerMap['connectionUpdate']
			| Set<EntityAccessor.EntityEventListenerMap['connectionUpdate']>
	}
}
