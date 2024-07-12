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

export type FieldEventListenerValue<
	E extends keyof FieldAccessor.FieldEventListenerMap,
	Persisted extends FieldValue = FieldValue,
> = Events<Persisted>[E] | Set<Events<Persisted>[E]>

export type UnsugarableFieldEventListeners<Persisted extends FieldValue = FieldValue> = {
	onInitialize?: FieldEventListenerValue<'initialize', Persisted>
	onBeforeUpdate?: FieldEventListenerValue<'beforeUpdate', Persisted>
	onUpdate?: FieldEventListenerValue<'update', Persisted>
}

const check:
	keyof UnsugarableFieldEventListeners extends `on${Capitalize<keyof Events>}`
		? `on${Capitalize<keyof Events>}` extends keyof UnsugarableFieldEventListeners
			? true
			: false
		: false = true
