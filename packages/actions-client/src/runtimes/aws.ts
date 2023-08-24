import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { RuntimeHandler, RuntimeResult } from '../runtimeHandler'
import { EventHandlerOptions, EventType, SingleEventHandler } from '../types'
import { createActionsRequestHandler } from '../requestHandler'

export type AwsLambdaHandlerArgs = [APIGatewayProxyEvent, Context]

const createAwsLambdaRuntimeHandler = (): RuntimeHandler<AwsLambdaHandlerArgs, APIGatewayProxyResult> => ({
	getJson: (args: AwsLambdaHandlerArgs): Promise<unknown> => {
		return Promise.resolve(JSON.parse(args[0].body || '{}'))
	},
	createContext: (args: AwsLambdaHandlerArgs) => {
		return { env: process.env }
	},
	createResponse: (result: RuntimeResult): APIGatewayProxyResult => {
		return {
			statusCode: result.ok ? 200 : result.code,
			body: JSON.stringify(result.ok ? result.payload : { error: result.error }),
			headers: { 'Content-Type': 'application/json' },
		}
	},
})

export const createActionsAwsLambdaHandler = <EventTypes extends EventType>(
	eventHandler: SingleEventHandler<AwsLambdaHandlerArgs, EventTypes>,
	options: EventHandlerOptions<EventTypes> = {},
): ((event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>) => {
	const runtimeHandler = createAwsLambdaRuntimeHandler()
	return createActionsRequestHandler(eventHandler, options, runtimeHandler)
}

export const isAwsLambda = (): boolean => typeof process !== 'undefined' && !!process.env.AWS_LAMBDA_FUNCTION_NAME
