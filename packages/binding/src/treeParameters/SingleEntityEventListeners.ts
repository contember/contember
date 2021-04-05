import { EntityAccessor } from '../accessors'
import { FieldName } from './primitives'

export interface DesugaredSingleEntityEventListeners {}

type AllEvents = EntityAccessor.EntityEventListenerMap
type StdEvents = Omit<AllEvents, 'connectionUpdate'>
export interface EntityEventListenerStore
	extends Map<keyof StdEvents | `connectionUpdate_${FieldName}`, Set<AllEvents[keyof AllEvents]>> {
	// Unfortunately, we have to enumerate these because otherwise, TS just can't handle the polymorphism.
	get(key: 'beforePersist'): Set<StdEvents['beforePersist']> | undefined
	get(key: 'beforeUpdate'): Set<StdEvents['beforeUpdate']> | undefined
	get(key: `connectionUpdate_${FieldName}`): Set<AllEvents['connectionUpdate']> | undefined
	get(key: 'persistError'): Set<StdEvents['persistError']> | undefined
	get(key: 'persistSuccess'): Set<StdEvents['persistSuccess']> | undefined
	get(key: 'update'): Set<StdEvents['update']> | undefined
	get(key: 'initialize'): Set<StdEvents['initialize']> | undefined
	get(key: `connectionUpdate_${FieldName}` | keyof StdEvents): Set<AllEvents[keyof AllEvents]> | undefined

	set(key: `connectionUpdate_${FieldName}` | keyof StdEvents, value: Set<AllEvents[keyof AllEvents]>): this
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
