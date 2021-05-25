import type { FieldAccessor } from '../accessors'
import type { FieldValue } from './primitives'

type Events<Value extends FieldValue = FieldValue> = FieldAccessor.FieldEventListenerMap<Value>

export interface DesugaredFieldEventListeners {}

export interface FieldEventListenerStore extends Map<keyof Events, Set<Events[keyof Events]>> {
	// Unfortunately, we have to enumerate these because otherwise, TS just can't handle the polymorphism.
	get(key: 'beforeUpdate'): Set<Events['beforeUpdate']> | undefined
	get(key: 'initialize'): Set<Events['initialize']> | undefined
	get(key: 'update'): Set<Events['update']> | undefined
	get(key: keyof Events): Set<Events[keyof Events]> | undefined

	set(key: keyof Events, value: Set<Events[keyof Events]>): this
}

export interface FieldEventListeners {
	eventListeners: FieldEventListenerStore | undefined
}

export interface SugarableFieldEventListeners {}

export type UnsugarableFieldEventListeners<
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
> = {
	[EventName in keyof Events & string as `on${Capitalize<EventName>}`]?: Events[EventName] | Set<Events[EventName]>
}
