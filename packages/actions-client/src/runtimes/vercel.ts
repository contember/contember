import type { VercelRequest, VercelResponse } from '@vercel/node'
import { RuntimeHandler, RuntimeResult } from '../runtimeHandler'
import { EventHandlerOptions, EventType, SingleEventHandler } from '../types'
import { createActionsRequestHandler } from '../requestHandler'

export type VercelHandlerArgs = [request: VercelRequest, response: VercelResponse]

const createVercelRuntimeHandler = (): RuntimeHandler<VercelHandlerArgs, void> => ({
	getJson: ([req]: VercelHandlerArgs): Promise<unknown> => {
		return Promise.resolve(req.body)
	},
	createContext: () => {
		return { env: process.env }
	},
	createResponse: (result: RuntimeResult, [, res]: VercelHandlerArgs) => {
		const responseStatus = result.ok ? 200 : result.code
		const responseBody = result.ok ? result.payload : { error: result.error }
		res.status(responseStatus).json(responseBody)
	},
})

export const createActionsVercelHandler = <EventTypes extends EventType>(
	eventHandler: SingleEventHandler<VercelHandlerArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
): ((...args: VercelHandlerArgs) => Promise<void>) => {
	const runtimeHandler = createVercelRuntimeHandler()
	return createActionsRequestHandler(eventHandler, options, runtimeHandler)
}

export const isVercel = (): boolean => typeof process !== 'undefined' && !!process.env.VERCEL || !!process.env.NOW_REGION
