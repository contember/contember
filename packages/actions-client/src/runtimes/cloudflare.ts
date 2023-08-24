import type { Response as CfResponse, ExportedHandlerFetchHandler, ExportedHandler } from '@cloudflare/workers-types'
import { RuntimeHandler, RuntimeResult } from '../runtimeHandler'
import { EventHandlerOptions, EventType, SingleEventHandler } from '../types'
import { createActionsRequestHandler } from '../requestHandler'

type CloudflareFetchHandlerArgs<Env extends Record<string, string>> = Parameters<ExportedHandlerFetchHandler<Env>>

export const createCloudflareRuntimeHandler = <Env extends Record<string, string>>(): RuntimeHandler<CloudflareFetchHandlerArgs<Env>, CfResponse> => ({
	getJson: ([req]: CloudflareFetchHandlerArgs<Env>): Promise<unknown> => {
		return req.json()
	},
	createContext: ([, env]: CloudflareFetchHandlerArgs<Env>) => {
		return { env }
	},
	createResponse: (result: RuntimeResult): CfResponse => {
		if (!result.ok) {
			return new Response(JSON.stringify({ error: result.error }), {
				status: result.code,
			}) as unknown as CfResponse
		}
		return new Response(JSON.stringify(result.payload), { status: 200 }) as unknown as CfResponse
	},
})


export const createActionsCloudflareHandler = <EventTypes extends EventType, Env extends Record<string, string>>(
	eventHandler: SingleEventHandler<CloudflareFetchHandlerArgs<Env>, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
): ExportedHandler<Env, unknown, unknown> => {
	return {
		fetch: createActionsRequestHandler(eventHandler, options, createCloudflareRuntimeHandler()),
	}
}

export const isCloudflare = (): boolean => {
	return typeof self !== 'undefined'
		&& self.constructor.name === 'ServiceWorkerGlobalScope'
		&& 'HTMLRewriter' in self
}
