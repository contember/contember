import { EntityAccessor } from '../accessors'
import { FieldName } from './primitives'

export interface DesugaredSingleEntityEventListeners {}

export interface SingleEntityEventListeners {
	eventListeners: {
		[Type in Exclude<EntityAccessor.EntityEventType, 'connectionUpdate'>]:
			| Set<EntityAccessor.EntityEventListenerMap[Type]>
			| undefined
	} & {
		connectionUpdate: Map<FieldName, Set<EntityAccessor.UpdateListener>> | undefined
	}
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
