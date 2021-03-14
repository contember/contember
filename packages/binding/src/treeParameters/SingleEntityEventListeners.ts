import { EntityAccessor } from '../accessors'
import { FieldName } from './primitives'

export interface DesugaredSingleEntityEventListeners {}

type StdEvents = Exclude<EntityAccessor.EntityEventListenerMap, 'connectionUpdate'>
export interface EntityEventListenerStore
	extends Map<
		keyof StdEvents,
		| {
				[E in keyof StdEvents]: Set<StdEvents[E]>
		  }[keyof StdEvents]
		| Map<FieldName, Set<EntityAccessor.UpdateListener>>
	> {
	// Unfortunately, we have to enumerate these because otherwise, TS just can't handle the polymorphism.
	get(key: 'connectionUpdate'): Map<FieldName, Set<EntityAccessor.UpdateListener>> | undefined
	get(key: 'beforePersist'): Set<StdEvents['beforePersist']> | undefined
	get(key: 'beforeUpdate'): Set<StdEvents['beforeUpdate']> | undefined
	get(key: 'persistError'): Set<StdEvents['persistError']> | undefined
	get(key: 'persistSuccess'): Set<StdEvents['persistSuccess']> | undefined
	get(key: 'update'): Set<StdEvents['update']> | undefined
	get(key: 'initialize'): Set<StdEvents['initialize']> | undefined
	get<K extends keyof StdEvents>(key: K): { [E in keyof StdEvents]: Set<StdEvents[E]> }[K] | undefined

	set(key: 'connectionUpdate', value: Map<FieldName, Set<EntityAccessor.UpdateListener>>): this
	set<K extends keyof StdEvents>(key: K, value: Set<StdEvents[K]>): this
}

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
