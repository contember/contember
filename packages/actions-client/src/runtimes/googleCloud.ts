import type { Request, Response } from 'express'
import { EventHandlerOptions, EventType, SingleEventHandler } from '../types'
import { createActionsRequestHandler } from '../requestHandler'
import { RuntimeHandler, RuntimeResult } from '../runtimeHandler'

export type GoogleCloudHandlerArgs = [Request, Response]

const createGoogleCloudRuntimeHandler = (): RuntimeHandler<GoogleCloudHandlerArgs, void> => ({
	getJson: ([req]: GoogleCloudHandlerArgs): Promise<unknown> => {
		return Promise.resolve(req.body)
	},
	createContext: () => {
		return { env: process.env }
	},
	createResponse: (result: RuntimeResult, [, res]: GoogleCloudHandlerArgs) => {
		const responseStatus = result.ok ? 200 : result.code
		const responseBody = result.ok ? result.payload : { error: result.error }
		res.status(responseStatus).json(responseBody)
	},
})

export const createActionsGoogleCloudHandler = <EventTypes extends EventType>(
	eventHandler: SingleEventHandler<GoogleCloudHandlerArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
): ((req: Request, res: Response) => Promise<void>) => {
	const runtimeHandler = createGoogleCloudRuntimeHandler()
	return createActionsRequestHandler(eventHandler, options, runtimeHandler)
}

export const isGoogleCloud = (): boolean => typeof process !== 'undefined' && !!process.env.FUNCTION_TARGET && !!process.env.FUNCTION_SIGNATURE_TYPE
