import { EventHandlerOptions, EventType, SingleEventHandler } from './types'
import {
	createActionsAwsLambdaHandler,
	createActionsAzureHandler,
	createActionsCloudflareHandler,
	createActionsGoogleCloudHandler,
	createActionsVercelHandler,
	isAwsLambda,
	isAzure,
	isCloudflare,
	isGoogleCloud,
	isVercel,
} from './runtimes'
type RuntimeFactories = Record<string, {
	matches: () => boolean
	create: (eventHandler: SingleEventHandler<any, EventType>, options?: EventHandlerOptions<EventType>) => any
}>

const runtimes: RuntimeFactories = {
	'cloudflare-workers': { matches: isCloudflare, create: createActionsCloudflareHandler },
	'azure-functions': { matches: isAzure, create: createActionsAzureHandler },
	'aws-lambda': { matches: isAwsLambda, create: createActionsAwsLambdaHandler },
	'vercel-functions': { matches: isVercel, create: createActionsVercelHandler },
	'google-cloud-functions': { matches: isGoogleCloud, create: createActionsGoogleCloudHandler },
}
export const createActionsHandler = <
	InputArgs extends any[],
	EventTypes extends EventType,
>(
	eventHandler: SingleEventHandler<InputArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
) => {
	for (const [key, runtime] of Object.entries(runtimes)) {
		if (runtime.matches()) {

			return runtime.create(eventHandler as any, options)
		}
	}
	throw new Error('unsupported environment')
}
