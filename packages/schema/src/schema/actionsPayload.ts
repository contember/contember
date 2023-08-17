import { Input } from './input'
import { JSONObject } from './json'

export namespace ActionsPayload {
	export type UpdateEvent = {
		operation: 'update'
		entity: string
		id: Input.PrimaryValue
		values: JSONObject
		old?: JSONObject
		selection?: any
		path?: string[]
	}

	export type CreateEvent = {
		operation: 'create'
		entity: string
		id: Input.PrimaryValue
		values: JSONObject
		selection?: any
		path?: string[]
	}

	export type DeleteEvent = {
		operation: 'delete'
		entity: string
		id: Input.PrimaryValue
		selection?: any
		path?: string[]
	}

	export type JunctionConnectEvent = {
		operation: 'junction_connect'
		entity: string
		id: Input.PrimaryValue
		relation: string
		inverseId: Input.PrimaryValue
		selection?: any
		path?: string[]
	}

	export type JunctionDisconnectEvent = {
		operation: 'junction_disconnect'
		entity: string
		id: Input.PrimaryValue
		relation: string
		inverseId: Input.PrimaryValue
		selection?: any
		path?: string[]
	}

	export type WatchEventPayload = {
		operation: 'watch'
		trigger: string
		entity: string
		id: Input.PrimaryValue
		events: BaseEventPayload[]
		selection?: any
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
			trigger: string
		}

	export type AnyEventPayload =
		| BasicEventPayload
		| WatchEventPayload


	export type WebhookEvent =
		& AnyEventPayload
		& {
			meta: {
				eventId: string
				transactionId: string
				createdAt: string
				lastStateChange: string
				numRetries: number
				trigger: string
				target: string
			}
		}

	export type WebhookRequestPayload = {
		events: WebhookEvent[]
	}

	export type WebhookResponsePayload = {
		failures: {
			eventId: string
			error?: string
		}
	}
}
