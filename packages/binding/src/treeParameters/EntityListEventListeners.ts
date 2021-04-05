import { EntityListAccessor } from '../accessors'
import { EntityEventListenerStore } from './SingleEntityEventListeners'

type Events = EntityListAccessor.EntityListEventListenerMap

export interface DesugaredEntityListEventListeners {}

export interface EntityListEventListenerStore
	extends Map<keyof Events, { [E in keyof Events]: Set<Events[E]> }[keyof Events]> {
	// Unfortunately, we have to enumerate these because otherwise, TS just can't handle the polymorphism.
	get(key: 'beforePersist'): Set<Events['beforePersist']> | undefined
	get(key: 'beforeUpdate'): Set<Events['beforeUpdate']> | undefined
	get(key: 'persistError'): Set<Events['persistError']> | undefined
	get(key: 'persistSuccess'): Set<Events['persistSuccess']> | undefined
	get(key: 'update'): Set<Events['update']> | undefined
	get(key: 'initialize'): Set<Events['initialize']> | undefined
	get<K extends keyof Events>(key: K): { [E in keyof Events]: Set<Events[E]> }[K] | undefined

	set<K extends keyof Events>(key: K, value: Set<Events[K]>): this
}

export interface EntityListEventListeners {
	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

export interface SugarableEntityListEventListeners {}

export type UnsugarableEntityListEventListeners = {
	[EventType in keyof Events & string as `on${Capitalize<EventType>}`]?: Events[EventType] | Set<Events[EventType]>
}
