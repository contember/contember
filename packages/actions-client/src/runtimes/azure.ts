import type { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { RuntimeHandler, RuntimeResult } from '../runtimeHandler'
import { EventHandlerOptions, EventType, SingleEventHandler } from '../types'
import { createActionsRequestHandler } from '../requestHandler'

export type AzureHandlerArgs = [Context, HttpRequest]

const createAzureRuntimeHandler = (): RuntimeHandler<AzureHandlerArgs, void> => ({
	getJson: (args: AzureHandlerArgs): Promise<unknown> => {
		return Promise.resolve(args[1].body)
	},
	createContext: (args: AzureHandlerArgs) => {
		return { env: process.env }
	},
	createResponse: (result: RuntimeResult, args: AzureHandlerArgs) => {
		const responseStatus = result.ok ? 200 : result.code
		const responseBody = result.ok ? result.payload : { error: result.error }
		args[0].res = {
			status: responseStatus,
			body: JSON.stringify(responseBody),
			headers: { 'Content-Type': 'application/json' },
		}
	},
})

export const createActionsAzureHandler = <EventTypes extends EventType>(
	eventHandler: SingleEventHandler<AzureHandlerArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
): AzureFunction => {
	const runtimeHandler = createAzureRuntimeHandler()
	return createActionsRequestHandler(eventHandler, options, runtimeHandler)
}

export const isAzure = (): boolean => typeof process !== 'undefined' && !!process.env.AZURE_FUNCTIONS_ENVIRONMENT
