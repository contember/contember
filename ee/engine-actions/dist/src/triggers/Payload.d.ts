import { Input, JSONObject } from '@contember/schema'
export declare type UpdateEvent = {
	operation: 'update'
	entity: string
	id: Input.PrimaryValue
	values: JSONObject
	old?: JSONObject
	selection?: any
	path?: string[]
}
export declare type CreateEvent = {
	operation: 'create'
	entity: string
	id: Input.PrimaryValue
	values: JSONObject
	selection?: any
	path?: string[]
}
export declare type DeleteEvent = {
	operation: 'delete'
	entity: string
	id: Input.PrimaryValue
	selection?: any
	path?: string[]
}
export declare type JunctionConnectEvent = {
	operation: 'junction-connect'
	entity: string
	id: Input.PrimaryValue
	relation: string
	inverseId: Input.PrimaryValue
	selection?: any
	path?: string[]
}
export declare type JunctionDisconnectEvent = {
	operation: 'junction-disconnect'
	entity: string
	id: Input.PrimaryValue
	relation: string
	inverseId: Input.PrimaryValue
	selection?: any
	path?: string[]
}
export declare type WatchEventPayload = {
	operation: 'watch'
	trigger: string
	entity: string
	id: Input.PrimaryValue
	events: BaseEventPayload[]
	selection?: any
}
export declare type BaseEventPayload = CreateEvent | UpdateEvent | DeleteEvent | JunctionConnectEvent | JunctionDisconnectEvent
export declare type BasicEventPayload = BaseEventPayload & {
	trigger: string
}
export declare type AnyEventPayload = BasicEventPayload | WatchEventPayload
export interface TriggerPayload {
	transactionId: string
	createdAt: string
	event: AnyEventPayload
}
//# sourceMappingURL=Payload.d.ts.map
