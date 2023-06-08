import { Logger } from '@contember/logger'
import { Actions } from '@contember/schema'
import { EventRow } from '../model/types'
import { VariablesMap } from '../model/VariablesManager'
import { AnyEventPayload } from '../triggers/Payload'

export { EventRow }

export interface InvokeHandler<Target extends Actions.AnyTarget> {
	handle(args: InvokeHandlerArgs<Target>): Promise<HandledEvent[]>
}

export interface InvokeHandlerArgs<Target extends Actions.AnyTarget> {
	target: Target
	events: EventRow[]
	logger: Logger
	variables: VariablesMap
}

export type HandledEvent = {
	row: EventRow
	result: InvocationResult
	target?: Actions.AnyTarget
}

export type InvocationResult = {
	ok: boolean
	durationMs?: number
	errorMessage?: string
	code?: number
	response?: string
}


export type WebhookEvent =
	& AnyEventPayload
	& {
		meta: {
			eventId: string
			transactionId: string
			createdAt: string
			lastStateChange: string
			numRetries: number
			trigger: string
			target: string
		}
	}

export type WebhookRequestPayload = {
	events: WebhookEvent[]
}
