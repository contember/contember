import { ActionsPayload } from '@contember/schema'

export type EventType = ActionsPayload.WebhookEvent['operation']

export interface EventHandlerOptions<EventTypes extends EventType> {
	type?: (EventTypes[]) | EventTypes
	errorHandler?: (e: any) => void
}

export type NarrowEventPayload<
	P extends { operation: EventType },
	E extends EventType,
> = P extends { operation: E } ? P : never

export type EventPayloadByType<E extends EventType> = NarrowEventPayload<ActionsPayload.WebhookEvent, E>

export interface ActionsEventHandlerContext<EventTypes extends EventType> {
	allEvents: EventPayloadByType<EventTypes>[]
}

export interface RuntimeEventHandlerContext {
	env: Record<string, string | undefined>
}

export type EventHandlerContext<EventTypes extends EventType> =
	& RuntimeEventHandlerContext
	& ActionsEventHandlerContext<EventTypes>

export type SingleEventHandler<
	InputArgs extends any[],
	EventTypes extends EventType,
> = (
	event: EventPayloadByType<EventTypes>,
	context: EventHandlerContext<EventTypes>,
	args: InputArgs,
) => Promise<void | boolean> | void | boolean
