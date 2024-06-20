import { Input } from './input'
import { JSONObject } from './json'

export namespace ActionsPayload {
	export type UpdateEvent = {
		readonly operation: 'update'
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly values: JSONObject
		readonly old?: JSONObject
		readonly selection?: JSONObject
		readonly path?: readonly string[]
	}

	export type CreateEvent = {
		readonly operation: 'create'
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly values: JSONObject
		readonly selection?: JSONObject
		readonly path?: readonly string[]
	}

	export type DeleteEvent = {
		readonly operation: 'delete'
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly selection?: JSONObject
		readonly path?: readonly string[]
	}

	export type JunctionConnectEvent = {
		readonly operation: 'junction_connect'
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly relation: string
		readonly inverseId: Input.PrimaryValue
		readonly selection?: JSONObject
		readonly path?: readonly string[]
	}

	export type JunctionDisconnectEvent = {
		readonly operation: 'junction_disconnect'
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly relation: string
		readonly inverseId: Input.PrimaryValue
		readonly selection?: JSONObject
		readonly path?: readonly string[]
	}

	export type WatchEventPayload = {
		readonly operation: 'watch'
		readonly trigger: string
		readonly entity: string
		readonly id: Input.PrimaryValue
		readonly events: readonly BaseEventPayload[]
		readonly selection?: JSONObject
	}

	export type BaseEventPayload =
		| CreateEvent
		| UpdateEvent
		| DeleteEvent
		| JunctionConnectEvent
		| JunctionDisconnectEvent

	export type BasicEventPayload =
		& BaseEventPayload
		& {
			readonly trigger: string
		}

	export type AnyEventPayload =
		| BasicEventPayload
		| WatchEventPayload


	export type WebhookMeta = {
		readonly eventId: string
		readonly transactionId: string
		readonly createdAt: string
		readonly lastStateChange: string
		readonly numRetries: number
		readonly trigger: string
		readonly target: string
	}

	export type WebhookEvent =
		& AnyEventPayload
		& {
			readonly meta: WebhookMeta
		}

	export type WebhookRequestPayload = {
		readonly events: readonly WebhookEvent[]
	}

	export type WebhookResponseFailure = {
		readonly eventId: string
		readonly error?: string
	}

	export type WebhookResponsePayload = {
		readonly failures: readonly WebhookResponseFailure[]
	}
}
