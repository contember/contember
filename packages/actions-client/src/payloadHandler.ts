import { ActionsPayload } from '@contember/schema'
import {
	EventHandlerContext,
	EventHandlerOptions,
	EventPayloadByType,
	EventType,
	RuntimeEventHandlerContext,
	SingleEventHandler,
} from './types'

export const createActionsPayloadHandler = <E extends EventType, Args extends any[]>(
	eventHandler: SingleEventHandler<Args, E>,
	options: EventHandlerOptions<E>,
	runtimeContext: RuntimeEventHandlerContext,
) => async (payload: ActionsPayload.WebhookRequestPayload, args: Args): Promise<ActionsPayload.WebhookResponsePayload> => {
	const expectedType = !options.type ? null : (Array.isArray(options.type) ? options.type : [options.type])

	const isSupportedEvent = (event: ActionsPayload.WebhookEvent): event is EventPayloadByType<E> => {
		return !expectedType || !expectedType.includes(event.operation as E)
	}

	// eslint-disable-next-line no-console
	const errorHandler = options.errorHandler ?? console.error

	const failures: ActionsPayload.WebhookResponseFailure[] = []

	const validEvents: EventPayloadByType<E>[] = []
	for (const event of payload.events) {
		if (!isSupportedEvent(event)) {
			failures.push({ eventId: event.meta.eventId, error: `Unsupported event type ${event.operation}` })
		} else {
			validEvents.push(event)
		}
	}
	const context: EventHandlerContext<E> = {
		...runtimeContext,
		allEvents: validEvents,
	}

	for (const event of validEvents) {
		try {
			const eventResult = await eventHandler(event, context, args)
			if (eventResult === false) {
				failures.push({ eventId: event.meta.eventId, error: 'Event handler returned "false"' })
			}
		} catch (e) {
			errorHandler(e)

			failures.push({
				eventId: event.meta.eventId,
				error: typeof e === 'string'
					? e
					: (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
						? e.message
						: JSON.stringify(e)
					),
			})
		}
	}

	return { failures }
}
