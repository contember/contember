import { ActionsPayload } from '@contember/schema'
import { RuntimeEventHandlerContext } from './types'

export type RuntimeHandler<InputArgs extends any[], OutputArgs> = {
	getJson: (args: InputArgs) => Promise<unknown>
	createResponse: (result: RuntimeResult, args: InputArgs) => OutputArgs
	createContext: (args: InputArgs) => RuntimeEventHandlerContext
}

export type RuntimeResult =
	| {
		ok: false
		code: number
		error: string
	}
	| {
		ok: true
		payload: ActionsPayload.WebhookResponsePayload
	}

