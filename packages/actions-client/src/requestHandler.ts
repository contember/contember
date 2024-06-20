import { EventHandlerOptions, EventType, SingleEventHandler } from './types'
import { createActionsPayloadHandler } from './payloadHandler'
import { ActionsPayload } from '@contember/schema'
import { RuntimeHandler } from './runtimeHandler'
import { webhookRequestPayloadSchema } from './typeSchema'

export const createActionsRequestHandler = <
	InputArgs extends any[],
	OutputArgs,
	EventTypes extends EventType,
>(
	eventHandler: SingleEventHandler<InputArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
	runtimeHandler: RuntimeHandler<InputArgs, OutputArgs>,
): (...args: InputArgs) => Promise<OutputArgs> => {

	const handler = async (...args: InputArgs) => {
		const payloadHandler = createActionsPayloadHandler(eventHandler, options, runtimeHandler.createContext(args))

		let json: ActionsPayload.WebhookRequestPayload

		try {
			json = webhookRequestPayloadSchema(await runtimeHandler.getJson(args))
		} catch (e: any) {
			// eslint-disable-next-line no-console
			console.error(e)
			return runtimeHandler.createResponse({ ok: false, code: 400, error: 'Invalid json: ' + e.message }, args)
		}
		try {
			const payloadResponse = await payloadHandler(json, args)

			return runtimeHandler.createResponse({ ok: true, payload: payloadResponse }, args)
		} catch (e: any) {
			// eslint-disable-next-line no-console
			console.error(e)
			return runtimeHandler.createResponse({ ok: false, code: 500, error: 'Internal error ' + e.message }, args)
		}
	}
	return handler as ((...args: InputArgs) => Promise<OutputArgs>)
}
