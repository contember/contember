import type { FieldAccessor } from '../accessors'
import type { FieldValue } from './primitives'
import type { EventListenersStore } from './EventListenersStore'

type Events<Value extends FieldValue = FieldValue> = FieldAccessor.FieldEventListenerMap<Value>

export type FieldEventListenerStore<Value extends FieldValue = FieldValue> = EventListenersStore<
	keyof Events<Value>,
	Partial<Events<Value>>
>

export interface FieldEventListeners {
	eventListeners: FieldEventListenerStore | undefined
}

export interface SugarableFieldEventListeners {}

export type UnsugarableFieldEventListeners<
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted,
> = {
	[EventName in keyof Events & string as `on${Capitalize<EventName>}`]?: Events[EventName] | Set<Events[EventName]>
}
